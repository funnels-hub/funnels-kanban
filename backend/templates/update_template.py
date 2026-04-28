import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path

from psycopg2.extras import Json

from conn import RealDictCursor, get_db_connection
from utils.defaults import DEFAULT_ROW1, DEFAULT_ROW2, PROTECTED_ROW1_IDS


def _serialize(row: dict) -> dict:
    out = dict(row)
    for key in ("created_at", "updated_at"):
        v = out.get(key)
        if isinstance(v, (datetime, date_type)):
            out[key] = v.isoformat()
    return out


def main(
    hospital_id: str,
    tpl_id: str,
    name: str | None = None,
    row1: list[dict] | None = None,
    row2: list[dict] | None = None,
    is_default: bool | None = None,
) -> dict:
    """부분 업데이트. 없으면 ValueError('NOT_FOUND').
    row1/row2는 list[dict] 그대로 JSONB 교체.
    is_default=True이면 다른 템플릿의 is_default를 false로 set.
    is_default=False unset 시도 시 ValueError('DEFAULT_REQUIRED').
    """
    if is_default is False:
        raise ValueError("DEFAULT_REQUIRED")

    # row1/row2가 input에 들어오면 protected r1 자동 보장
    if row1 is not None:
        existing_r1_ids = {r["id"] for r in row1}
        for protected_id in PROTECTED_ROW1_IDS:
            if protected_id not in existing_r1_ids:
                default = next(
                    (r for r in DEFAULT_ROW1 if r["id"] == protected_id), None
                )
                if default:
                    row1.insert(0, {"id": default["id"], "label": default["label"]})
                    if row2 is not None:
                        for d in DEFAULT_ROW2:
                            if d["row1_id"] == protected_id:
                                row2.append(
                                    {
                                        "id": d["id"],
                                        "row1_id": d["row1_id"],
                                        "label": d["label"],
                                    }
                                )

    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id FROM templates WHERE hospital_id = %s AND id = %s",
            (hospital_id, tpl_id),
        )
        if cur.fetchone() is None:
            conn.close()
            raise ValueError("NOT_FOUND")

        # is_default=True로 set되는 순간, row1이 입력에 없더라도
        # 기존 row1을 SELECT해서 보호 row1(r1_구환/r1_신환) 누락 시 자동 추가
        if is_default is True and row1 is None:
            cur.execute(
                "SELECT row1, row2 FROM templates "
                "WHERE hospital_id = %s AND id = %s",
                (hospital_id, tpl_id),
            )
            cur_row = cur.fetchone()
            if cur_row:
                existing_row1 = list(cur_row["row1"])
                existing_row2 = list(cur_row["row2"])
                existing_r1_ids = {r["id"] for r in existing_row1}
                modified = False
                for protected_id in PROTECTED_ROW1_IDS:
                    if protected_id not in existing_r1_ids:
                        default = next(
                            (r for r in DEFAULT_ROW1 if r["id"] == protected_id),
                            None,
                        )
                        if default:
                            existing_row1.insert(
                                0,
                                {"id": default["id"], "label": default["label"]},
                            )
                            for d in DEFAULT_ROW2:
                                if d["row1_id"] == protected_id:
                                    existing_row2.append(
                                        {
                                            "id": d["id"],
                                            "row1_id": d["row1_id"],
                                            "label": d["label"],
                                        }
                                    )
                            modified = True
                if modified:
                    row1 = existing_row1
                    row2 = existing_row2

        sets = []
        params: list = []
        if name is not None:
            sets.append("name = %s")
            params.append(name)
        if row1 is not None:
            sets.append("row1 = %s")
            params.append(Json(row1))
        if row2 is not None:
            sets.append("row2 = %s")
            params.append(Json(row2))

        if sets:
            sets.append("updated_at = NOW()")
            params.append(hospital_id)
            params.append(tpl_id)
            cur.execute(
                f"UPDATE templates SET {', '.join(sets)} "
                "WHERE hospital_id = %s AND id = %s",
                tuple(params),
            )

        if is_default is True:
            cur.execute(
                "UPDATE templates SET is_default = false "
                "WHERE hospital_id = %s AND id != %s AND is_default = true",
                (hospital_id, tpl_id),
            )
            cur.execute(
                "UPDATE templates SET is_default = true "
                "WHERE hospital_id = %s AND id = %s",
                (hospital_id, tpl_id),
            )

        if sets or is_default is True:
            conn.commit()

        cur.execute(
            "SELECT id, name, row1, row2, is_default, created_at, updated_at "
            "FROM templates WHERE hospital_id = %s AND id = %s",
            (hospital_id, tpl_id),
        )
        row = dict(cur.fetchone())
    conn.close()
    return _serialize(row)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", required=True, dest="hospital_id")
    parser.add_argument("--tpl-id", required=True, dest="tpl_id")
    parser.add_argument("--name")
    parser.add_argument("--row1", help="JSON string: list[{id,label}]")
    parser.add_argument("--row2", help="JSON string: list[{id,row1_id,label}]")
    parser.add_argument(
        "--is-default",
        dest="is_default",
        choices=["true", "false"],
        help="set true/false to flip default (unset will raise DEFAULT_REQUIRED)",
    )
    args = parser.parse_args()

    row1_val = json.loads(args.row1) if args.row1 is not None else None
    row2_val = json.loads(args.row2) if args.row2 is not None else None
    is_default_val = (
        None if args.is_default is None else (args.is_default == "true")
    )

    result = main(
        args.hospital_id, args.tpl_id, args.name, row1_val, row2_val, is_default_val
    )

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

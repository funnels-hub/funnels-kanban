import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path
from uuid import uuid4

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


def main(hospital_id: str, name: str, source_date: str | None = None) -> dict:
    """source_date 명시되면 그 date의 컬럼, 없으면 가장 최근 date의 columns,
    둘 다 없으면 DEFAULT.
    is_default=false. 새 id: tpl_{uuid4().hex[:12]}.
    """
    new_id = f"tpl_{uuid4().hex[:12]}"
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if source_date is None:
            cur.execute(
                "SELECT MAX(date) AS max_date FROM column_row1 WHERE hospital_id = %s",
                (hospital_id,),
            )
            res = cur.fetchone()
            max_date = res["max_date"] if res else None
            if max_date is not None:
                source_date = (
                    max_date.isoformat()
                    if isinstance(max_date, date_type)
                    else max_date
                )

        if source_date is not None:
            cur.execute(
                "SELECT id, label FROM column_row1 "
                "WHERE hospital_id = %s AND date = %s ORDER BY position ASC",
                (hospital_id, source_date),
            )
            row1 = [{"id": r["id"], "label": r["label"]} for r in cur.fetchall()]
            cur.execute(
                "SELECT id, row1_id, label FROM column_row2 "
                "WHERE hospital_id = %s AND date = %s ORDER BY position ASC",
                (hospital_id, source_date),
            )
            row2 = [
                {"id": r["id"], "row1_id": r["row1_id"], "label": r["label"]}
                for r in cur.fetchall()
            ]
        else:
            row1 = []
            row2 = []

        if not row1:
            row1 = [{"id": r["id"], "label": r["label"]} for r in DEFAULT_ROW1]
            row2 = [
                {"id": r["id"], "row1_id": r["row1_id"], "label": r["label"]}
                for r in DEFAULT_ROW2
            ]

        # 누락된 protected r1 자동 추가
        existing_r1_ids = {r["id"] for r in row1}
        for protected_id in PROTECTED_ROW1_IDS:
            if protected_id not in existing_r1_ids:
                default = next(
                    (r for r in DEFAULT_ROW1 if r["id"] == protected_id), None
                )
                if default:
                    row1.insert(0, {"id": default["id"], "label": default["label"]})
                    for d in DEFAULT_ROW2:
                        if d["row1_id"] == protected_id:
                            row2.append(
                                {
                                    "id": d["id"],
                                    "row1_id": d["row1_id"],
                                    "label": d["label"],
                                }
                            )

        cur.execute(
            "INSERT INTO templates (hospital_id, id, name, row1, row2, is_default) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (hospital_id, new_id, name, Json(row1), Json(row2), False),
        )
        conn.commit()

        cur.execute(
            "SELECT id, name, row1, row2, is_default, created_at, updated_at "
            "FROM templates WHERE id = %s",
            (new_id,),
        )
        row = dict(cur.fetchone())
    conn.close()
    return _serialize(row)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", dest="hospital_id", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--source-date", dest="source_date")
    args = parser.parse_args()

    result = main(args.hospital_id, args.name, args.source_date)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

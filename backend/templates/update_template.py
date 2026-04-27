import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path

from psycopg2.extras import Json

from backend.conn import RealDictCursor, get_db_connection


def _serialize(row: dict) -> dict:
    out = dict(row)
    for key in ("created_at", "updated_at"):
        v = out.get(key)
        if isinstance(v, (datetime, date_type)):
            out[key] = v.isoformat()
    return out


def main(
    tpl_id: str,
    name: str | None = None,
    row1: list[dict] | None = None,
    row2: list[dict] | None = None,
) -> dict:
    """부분 업데이트. 없으면 ValueError('NOT_FOUND').
    row1/row2는 list[dict] 그대로 JSONB 교체.
    """
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id FROM templates WHERE id = %s", (tpl_id,))
        if cur.fetchone() is None:
            conn.close()
            raise ValueError("NOT_FOUND")

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
            params.append(tpl_id)
            cur.execute(
                f"UPDATE templates SET {', '.join(sets)} WHERE id = %s",
                tuple(params),
            )
            conn.commit()

        cur.execute(
            "SELECT id, name, row1, row2, is_default, created_at, updated_at "
            "FROM templates WHERE id = %s",
            (tpl_id,),
        )
        row = dict(cur.fetchone())
    conn.close()
    return _serialize(row)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tpl-id", required=True, dest="tpl_id")
    parser.add_argument("--name")
    parser.add_argument("--row1", help="JSON string: list[{id,label}]")
    parser.add_argument("--row2", help="JSON string: list[{id,row1_id,label}]")
    args = parser.parse_args()

    row1_val = json.loads(args.row1) if args.row1 is not None else None
    row2_val = json.loads(args.row2) if args.row2 is not None else None

    result = main(args.tpl_id, args.name, row1_val, row2_val)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

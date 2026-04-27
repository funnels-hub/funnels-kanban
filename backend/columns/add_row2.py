import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from backend.conn import RealDictCursor, get_db_connection
from backend.utils.propagation import ensure_columns_for_date


def _serialize(row: dict) -> dict:
    out = dict(row)
    d = out.get("date")
    if isinstance(d, date_type):
        out["date"] = d.isoformat()
    return out


def main(hospital_id: str, date: str, row1_id: str, label: str, position: int | None = None) -> dict:
    conn = get_db_connection()
    try:
        ensure_columns_for_date(conn, hospital_id, date)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT 1 FROM column_row1 WHERE hospital_id = %s AND date = %s AND id = %s",
                (hospital_id, date, row1_id),
            )
            if not cur.fetchone():
                raise ValueError("NOT_FOUND")

            if position is None:
                cur.execute(
                    "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos "
                    "FROM column_row2 WHERE hospital_id = %s AND date = %s AND row1_id = %s",
                    (hospital_id, date, row1_id),
                )
                position = cur.fetchone()["next_pos"]

            new_id = f"r2_user_{uuid4().hex[:8]}"
            cur.execute(
                "INSERT INTO column_row2 (hospital_id, id, date, row1_id, label, position, built_in) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                "RETURNING id, date, row1_id, label, position, built_in",
                (hospital_id, new_id, date, row1_id, label, position, False),
            )
            inserted = dict(cur.fetchone())
        conn.commit()
    finally:
        conn.close()

    return _serialize(inserted)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", required=True)
    parser.add_argument("--date", required=True)
    parser.add_argument("--row1-id", required=True)
    parser.add_argument("--label", required=True)
    parser.add_argument("--position", type=int)
    args = parser.parse_args()

    result = main(args.hospital_id, args.date, args.row1_id, args.label, args.position)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

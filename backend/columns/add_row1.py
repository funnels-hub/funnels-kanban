import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from backend.conn import RealDictCursor, get_db_connection
from backend.utils.propagation import ensure_columns_for_date


def main(date: str, label: str, position: int | None = None) -> dict:
    """추가된 ColumnRow1 dict 반환."""
    new_id = f"r1_user_{uuid4().hex[:8]}"
    conn = get_db_connection()
    ensure_columns_for_date(conn, date)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if position is None:
            cur.execute(
                "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos "
                "FROM column_row1 WHERE date = %s",
                (date,),
            )
            position = cur.fetchone()["next_pos"]
        cur.execute(
            "INSERT INTO column_row1 (id, date, label, position, built_in) "
            "VALUES (%s, %s, %s, %s, %s) "
            "RETURNING id, date, label, position, built_in",
            (new_id, date, label, position, False),
        )
        row = dict(cur.fetchone())
    conn.commit()
    conn.close()
    if isinstance(row["date"], date_type):
        row["date"] = row["date"].isoformat()
    return row


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", required=True)
    parser.add_argument("--label", required=True)
    parser.add_argument("--position", type=int)
    args = parser.parse_args()

    result = main(args.date, args.label, args.position)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

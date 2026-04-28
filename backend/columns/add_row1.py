import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from conn import RealDictCursor, get_db_connection
from utils.propagation import ensure_columns_for_date


def main(hospital_id: str, date: str, label: str, position: int | None = None) -> dict:
    """추가된 ColumnRow1 dict 반환 (기본 leaf 1개도 함께 생성)."""
    new_id = f"r1_user_{uuid4().hex[:8]}"
    new_leaf_id = f"r2_user_{uuid4().hex[:8]}"
    conn = get_db_connection()
    ensure_columns_for_date(conn, hospital_id, date)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if position is None:
            cur.execute(
                "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos "
                "FROM column_row1 WHERE hospital_id = %s AND date = %s",
                (hospital_id, date),
            )
            position = cur.fetchone()["next_pos"]
        cur.execute(
            "INSERT INTO column_row1 (hospital_id, id, date, label, position, built_in) "
            "VALUES (%s, %s, %s, %s, %s, %s) "
            "RETURNING id, date, label, position, built_in",
            (hospital_id, new_id, date, label, position, False),
        )
        row = dict(cur.fetchone())
        cur.execute(
            "INSERT INTO column_row2 (hospital_id, id, date, row1_id, label, position, built_in) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (hospital_id, new_leaf_id, date, new_id, "컬럼1", 0, False),
        )
    conn.commit()
    conn.close()
    if isinstance(row["date"], date_type):
        row["date"] = row["date"].isoformat()
    return row


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", required=True)
    parser.add_argument("--date", required=True)
    parser.add_argument("--label", required=True)
    parser.add_argument("--position", type=int)
    args = parser.parse_args()

    result = main(args.hospital_id, args.date, args.label, args.position)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

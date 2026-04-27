import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path

from backend.conn import RealDictCursor, get_db_connection


def main(hospital_id: str, date: str) -> list[dict]:
    """해당 hospital_id + date의 카드 목록. created_at/updated_at은 ISO 문자열, date도 isoformat."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT * FROM cards WHERE hospital_id = %s AND date = %s ORDER BY time, created_at",
            (hospital_id, date),
        )
        rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    for row in rows:
        if isinstance(row.get("date"), date_type):
            row["date"] = row["date"].isoformat()
        if isinstance(row.get("created_at"), datetime):
            row["created_at"] = row["created_at"].isoformat()
        if isinstance(row.get("updated_at"), datetime):
            row["updated_at"] = row["updated_at"].isoformat()
    return rows


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", required=True)
    parser.add_argument("--date", required=True)
    args = parser.parse_args()

    result = main(args.hospital_id, args.date)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path

from backend.conn import RealDictCursor, get_db_connection


def main(chart: str, date: str | None = None) -> list[dict]:
    """같은 chart의 카드 목록. date 지정 시 그 date 한정. created_at 기준 desc."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if date is None:
            cur.execute(
                "SELECT * FROM cards WHERE chart = %s ORDER BY created_at DESC",
                (chart,),
            )
        else:
            cur.execute(
                "SELECT * FROM cards WHERE chart = %s AND date = %s ORDER BY created_at DESC",
                (chart, date),
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
    parser.add_argument("--chart", required=True)
    parser.add_argument("--date")
    args = parser.parse_args()

    result = main(args.chart, args.date)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

import argparse
import json
from pathlib import Path
from datetime import datetime

from backend.conn import get_db_connection, RealDictCursor


def main(date: str, r2_id: str) -> dict:
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT row1_id FROM column_row2 WHERE date = %s AND id = %s",
            (date, r2_id),
        )
        row = cur.fetchone()
        if row is None:
            raise ValueError("NOT_FOUND")
        row1_id = row["row1_id"]

        cur.execute(
            "SELECT COUNT(*) AS cnt FROM column_row2 WHERE date = %s AND row1_id = %s",
            (date, row1_id),
        )
        cnt = cur.fetchone()["cnt"]
        if cnt == 1:
            raise ValueError("LAST_LEAF")

        cur.execute(
            "DELETE FROM cards WHERE date = %s AND row2_id = %s",
            (date, r2_id),
        )
        cards_deleted = cur.rowcount

        cur.execute(
            "DELETE FROM column_row2 WHERE date = %s AND id = %s",
            (date, r2_id),
        )

    conn.commit()
    conn.close()

    return {"deleted": True, "cards_deleted": cards_deleted}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", required=True)
    parser.add_argument("--r2-id", required=True)
    args = parser.parse_args()

    result = main(args.date, args.r2_id)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

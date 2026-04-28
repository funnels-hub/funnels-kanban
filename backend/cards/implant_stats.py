import argparse
import json
from datetime import datetime
from pathlib import Path

from conn import RealDictCursor, get_db_connection
from utils.defaults import DEFAULT_ROW2


def main(hospital_id: str, date: str) -> dict:
    """ImplantStats dict."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, label FROM column_row2 "
            "WHERE hospital_id = %s AND date = %s AND row1_id = 'r1_임플' "
            "ORDER BY position",
            (hospital_id, date),
        )
        leaves = [dict(r) for r in cur.fetchall()]

        if not leaves:
            leaves = [
                {"id": leaf["id"], "label": leaf["label"]}
                for leaf in DEFAULT_ROW2
                if leaf["row1_id"] == "r1_임플"
            ]

        by_leaf = {leaf["id"]: {"label": leaf["label"], "count": 0} for leaf in leaves}

        cur.execute(
            "SELECT row2_id, COUNT(*) AS cnt FROM cards "
            "WHERE hospital_id = %s AND date = %s AND row1_id = 'r1_임플' "
            "GROUP BY row2_id",
            (hospital_id, date),
        )
        counts = cur.fetchall()
    conn.close()

    for row in counts:
        r2_id = row["row2_id"]
        if r2_id in by_leaf:
            by_leaf[r2_id]["count"] = int(row["cnt"])

    total = sum(entry["count"] for entry in by_leaf.values())

    return {"date": date, "total": total, "by_leaf": by_leaf}


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

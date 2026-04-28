import argparse
import json
from datetime import datetime
from pathlib import Path

from conn import get_db_connection
from utils.propagation import ensure_columns_for_date, get_columns_for_date


def main(
    hospital_id: str,
    date: str,
    row1_ids: list[str] | None = None,
    row2_ids: dict[str, list[str]] | None = None,
) -> dict:
    """모든 위치 갱신 후 ColumnsBundle dict 반환."""
    conn = get_db_connection()
    try:
        ensure_columns_for_date(conn, hospital_id, date)
        with conn.cursor() as cur:
            if row1_ids is not None:
                for idx, r1_id in enumerate(row1_ids):
                    cur.execute(
                        "UPDATE column_row1 SET position = %s "
                        "WHERE hospital_id = %s AND date = %s AND id = %s",
                        (idx, hospital_id, date, r1_id),
                    )

            if row2_ids is not None:
                for r1_id, ordered_r2_ids in row2_ids.items():
                    for idx, r2_id in enumerate(ordered_r2_ids):
                        cur.execute(
                            "UPDATE column_row2 SET position = %s, row1_id = %s "
                            "WHERE hospital_id = %s AND date = %s AND id = %s",
                            (idx, r1_id, hospital_id, date, r2_id),
                        )
        conn.commit()
    finally:
        conn.close()

    return get_columns_for_date(hospital_id, date)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", required=True)
    parser.add_argument("--date", required=True)
    parser.add_argument("--row1-ids")
    parser.add_argument("--row2-ids")
    args = parser.parse_args()

    row1_ids = json.loads(args.row1_ids) if args.row1_ids else None
    row2_ids = json.loads(args.row2_ids) if args.row2_ids else None

    result = main(args.hospital_id, args.date, row1_ids, row2_ids)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

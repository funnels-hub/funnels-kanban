import argparse
import json

from conn import get_db_connection
from utils.defaults import PROTECTED_ROW1_IDS


def main(hospital_id: str, date: str, r1_id: str) -> dict:
    """{'deleted': True, 'cards_deleted': N}"""
    if r1_id in PROTECTED_ROW1_IDS:
        raise ValueError("PROTECTED_ROW1")
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM cards WHERE hospital_id = %s AND date = %s AND row1_id = %s",
            (hospital_id, date, r1_id),
        )
        cards_deleted = cur.rowcount

        cur.execute(
            "DELETE FROM column_row1 WHERE hospital_id = %s AND date = %s AND id = %s",
            (hospital_id, date, r1_id),
        )
    conn.commit()
    conn.close()
    return {"deleted": True, "cards_deleted": cards_deleted}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", required=True)
    parser.add_argument("--date", required=True)
    parser.add_argument("--r1-id", required=True)
    args = parser.parse_args()

    result = main(args.hospital_id, args.date, args.r1_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))

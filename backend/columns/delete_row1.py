import argparse
import json

from backend.conn import get_db_connection


def main(date: str, r1_id: str) -> dict:
    """{'deleted': True, 'cards_deleted': N}"""
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM cards WHERE date = %s AND row1_id = %s",
            (date, r1_id),
        )
        cards_deleted = cur.rowcount

        cur.execute(
            "DELETE FROM column_row1 WHERE date = %s AND id = %s",
            (date, r1_id),
        )
    conn.commit()
    conn.close()
    return {"deleted": True, "cards_deleted": cards_deleted}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", required=True)
    parser.add_argument("--r1-id", required=True)
    args = parser.parse_args()

    result = main(args.date, args.r1_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))

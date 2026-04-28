import argparse
import json
from datetime import datetime
from pathlib import Path

from conn import get_db_connection


def main(hospital_id: str, card_id: str) -> dict:
    """{'deleted': True, 'card_id': str}. 카드 없으면 ValueError('NOT_FOUND')."""
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute("DELETE FROM cards WHERE hospital_id = %s AND id = %s", (hospital_id, card_id))
        if cur.rowcount == 0:
            conn.close()
            raise ValueError("NOT_FOUND")
        conn.commit()
    conn.close()
    return {"deleted": True, "card_id": card_id}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", dest="hospital_id", required=True)
    parser.add_argument("--card-id", dest="card_id", required=True)
    args = parser.parse_args()

    result = main(args.hospital_id, args.card_id)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

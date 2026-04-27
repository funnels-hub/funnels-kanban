import argparse
import json
from datetime import datetime
from pathlib import Path

from backend.conn import get_db_connection


def main(tpl_id: str) -> dict:
    """{'deleted': True, 'tpl_id': str}.
    is_default=true 인 템플릿은 삭제 거부 → ValueError('CANNOT_DELETE_DEFAULT')."""
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT is_default FROM templates WHERE id = %s", (tpl_id,))
        row = cur.fetchone()
        if row is None:
            conn.close()
            raise ValueError("NOT_FOUND")
        if row[0]:
            conn.close()
            raise ValueError("CANNOT_DELETE_DEFAULT")

        cur.execute("DELETE FROM templates WHERE id = %s", (tpl_id,))
        conn.commit()
    conn.close()
    return {"deleted": True, "tpl_id": tpl_id}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tpl-id", dest="tpl_id", required=True)
    args = parser.parse_args()

    result = main(args.tpl_id)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

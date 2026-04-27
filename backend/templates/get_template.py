import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path

from backend.conn import RealDictCursor, get_db_connection


def _serialize(row: dict) -> dict:
    out = dict(row)
    for key in ("created_at", "updated_at"):
        v = out.get(key)
        if isinstance(v, (datetime, date_type)):
            out[key] = v.isoformat()
    return out


def main(hospital_id: str, tpl_id: str) -> dict:
    """없으면 ValueError('NOT_FOUND')."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, name, row1, row2, is_default, created_at, updated_at "
            "FROM templates WHERE hospital_id = %s AND id = %s",
            (hospital_id, tpl_id),
        )
        row = cur.fetchone()
    conn.close()
    if row is None:
        raise ValueError("NOT_FOUND")
    return _serialize(dict(row))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", required=True, dest="hospital_id")
    parser.add_argument("--tpl-id", required=True, dest="tpl_id")
    args = parser.parse_args()

    result = main(args.hospital_id, args.tpl_id)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

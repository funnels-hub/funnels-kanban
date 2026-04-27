import argparse
import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from backend.conn import RealDictCursor, get_db_connection


def main(tpl_id: str) -> dict:
    """원본 복제 → 새 id, name=원본+' 사본', is_default=false. 새 row dict 반환."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM templates WHERE id = %s", (tpl_id,))
        original = cur.fetchone()
        if original is None:
            conn.close()
            raise ValueError("NOT_FOUND")

        new_id = f"tpl_{uuid4().hex[:12]}"
        new_name = f"{original['name']} 사본"

        cur.execute(
            "INSERT INTO templates (id, name, row1, row2, is_default) "
            "VALUES (%s, %s, %s, %s, %s)",
            (
                new_id,
                new_name,
                json.dumps(original["row1"], ensure_ascii=False),
                json.dumps(original["row2"], ensure_ascii=False),
                False,
            ),
        )
        conn.commit()

        cur.execute("SELECT * FROM templates WHERE id = %s", (new_id,))
        tpl = dict(cur.fetchone())
    conn.close()

    if isinstance(tpl.get("created_at"), datetime):
        tpl["created_at"] = tpl["created_at"].isoformat()
    if isinstance(tpl.get("updated_at"), datetime):
        tpl["updated_at"] = tpl["updated_at"].isoformat()
    return tpl


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

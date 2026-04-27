import argparse
from datetime import date as date_type, datetime
from backend.conn import RealDictCursor, get_db_connection


def main() -> list[dict]:
    """모든 hospitals 목록 (created_at desc). password_hash 제외."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, name, email, is_admin, is_active, created_at, updated_at "
            "FROM hospitals ORDER BY created_at DESC"
        )
        rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    for r in rows:
        for k in ("created_at", "updated_at"):
            if isinstance(r.get(k), (datetime, date_type)):
                r[k] = r[k].isoformat()
    return rows


if __name__ == "__main__":
    import json
    print(json.dumps(main(), ensure_ascii=False, indent=2))

import argparse
from datetime import date as date_type, datetime
from uuid import uuid4
import bcrypt
import psycopg2

from conn import RealDictCursor, get_db_connection


def main(name: str, email: str, password: str) -> dict:
    """신규 hospital 생성. password는 bcrypt 해싱.

    Raises:
        ValueError("EMAIL_TAKEN"): unique violation
    """
    new_id = f"hospital_{uuid4().hex[:12]}"
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO hospitals (id, name, email, password_hash, is_admin, is_active) "
                "VALUES (%s, %s, %s, %s, false, true) "
                "RETURNING id, name, email, is_admin, is_active, created_at, updated_at",
                (new_id, name, email, password_hash),
            )
            row = dict(cur.fetchone())
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise ValueError("EMAIL_TAKEN")
    finally:
        conn.close()
    for k in ("created_at", "updated_at"):
        if isinstance(row.get(k), (datetime, date_type)):
            row[k] = row[k].isoformat()
    return row


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()
    import json
    print(json.dumps(main(args.name, args.email, args.password), ensure_ascii=False, indent=2))

import os
from dotenv import load_dotenv
load_dotenv("backend/.env")

import bcrypt
from conn import RealDictCursor, get_db_connection

ADMIN_ID = "hospital-admin"
ADMIN_NAME = "Funnels Admin"
ADMIN_EMAIL = "admin@funnels.co.kr"
ADMIN_PASSWORD = "vjsjftm1!"


def main() -> dict:
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id FROM hospitals WHERE id = %s", (ADMIN_ID,))
        if cur.fetchone():
            conn.close()
            return {"action": "skipped", "id": ADMIN_ID, "reason": "already exists"}

        password_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt(rounds=12)).decode()
        cur.execute(
            "INSERT INTO hospitals (id, name, email, password_hash, is_admin, is_active) "
            "VALUES (%s, %s, %s, %s, true, true) "
            "RETURNING id, name, email, is_admin, is_active",
            (ADMIN_ID, ADMIN_NAME, ADMIN_EMAIL, password_hash),
        )
        row = dict(cur.fetchone())
        conn.commit()
    conn.close()
    return {"action": "created", **row}


if __name__ == "__main__":
    import json
    print(json.dumps(main(), ensure_ascii=False, indent=2))

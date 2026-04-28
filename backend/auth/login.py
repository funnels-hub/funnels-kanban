import argparse
import bcrypt

from conn import RealDictCursor, get_db_connection
from utils.auth_helper import create_access_token


def main(email: str, password: str) -> dict:
    """이메일/비번 검증, JWT + HospitalPublic 반환.

    Raises:
        ValueError("INVALID_CREDENTIALS"): 이메일 없거나 비번 틀림
        ValueError("DEACTIVATED"): is_active=false
    """
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, name, email, password_hash, is_admin, is_active "
            "FROM hospitals WHERE email = %s",
            (email,),
        )
        row = cur.fetchone()
    conn.close()

    if not row:
        raise ValueError("INVALID_CREDENTIALS")
    if not bcrypt.checkpw(password.encode(), row["password_hash"].encode()):
        raise ValueError("INVALID_CREDENTIALS")
    if not row["is_active"]:
        raise ValueError("DEACTIVATED")

    token = create_access_token(row["id"], row["email"], row["is_admin"])
    return {
        "access_token": token,
        "hospital": {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "is_admin": row["is_admin"],
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()
    import json
    print(json.dumps(main(args.email, args.password), ensure_ascii=False, indent=2))

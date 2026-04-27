import argparse
from datetime import date as date_type, datetime
import bcrypt
from backend.conn import RealDictCursor, get_db_connection


def main(hospital_id: str, name: str | None = None, password: str | None = None,
         is_active: bool | None = None) -> dict:
    """부분 업데이트. 없으면 ValueError('NOT_FOUND')."""
    set_clauses = []
    values = []
    if name is not None:
        set_clauses.append("name = %s")
        values.append(name)
    if password is not None:
        set_clauses.append("password_hash = %s")
        values.append(bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode())
    if is_active is not None:
        set_clauses.append("is_active = %s")
        values.append(is_active)

    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if set_clauses:
            set_clauses.append("updated_at = now()")
            sql = f"UPDATE hospitals SET {', '.join(set_clauses)} WHERE id = %s"
            cur.execute(sql, values + [hospital_id])
        cur.execute(
            "SELECT id, name, email, is_admin, is_active, created_at, updated_at "
            "FROM hospitals WHERE id = %s",
            (hospital_id,),
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            raise ValueError("NOT_FOUND")
        row = dict(row)
        conn.commit()
    conn.close()
    for k in ("created_at", "updated_at"):
        if isinstance(row.get(k), (datetime, date_type)):
            row[k] = row[k].isoformat()
    return row


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", dest="hospital_id", required=True)
    parser.add_argument("--name")
    parser.add_argument("--password")
    parser.add_argument("--is-active", dest="is_active", choices=["true", "false"])
    args = parser.parse_args()
    is_act = None if args.is_active is None else args.is_active == "true"
    import json
    print(json.dumps(main(args.hospital_id, args.name, args.password, is_act), ensure_ascii=False, indent=2))

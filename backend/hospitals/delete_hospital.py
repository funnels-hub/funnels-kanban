import argparse
from backend.conn import RealDictCursor, get_db_connection


def main(hospital_id: str, current_id: str | None = None) -> dict:
    """soft delete (is_active=false). 자기 자신/admin은 거부.

    Raises:
        ValueError("NOT_FOUND")
        ValueError("CANNOT_DELETE_SELF")
        ValueError("CANNOT_DELETE_ADMIN")
    """
    if current_id and current_id == hospital_id:
        raise ValueError("CANNOT_DELETE_SELF")

    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, is_admin FROM hospitals WHERE id = %s", (hospital_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            raise ValueError("NOT_FOUND")
        if row["is_admin"]:
            conn.close()
            raise ValueError("CANNOT_DELETE_ADMIN")
        cur.execute(
            "UPDATE hospitals SET is_active = false, updated_at = now() WHERE id = %s",
            (hospital_id,),
        )
        conn.commit()
    conn.close()
    return {"deleted": True, "hospital_id": hospital_id}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", dest="hospital_id", required=True)
    parser.add_argument("--current-id", dest="current_id")
    args = parser.parse_args()
    import json
    print(json.dumps(main(args.hospital_id, args.current_id), ensure_ascii=False, indent=2))

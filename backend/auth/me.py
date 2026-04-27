import argparse
from backend.conn import RealDictCursor, get_db_connection


def main(hospital_id: str) -> dict:
    """HospitalPublic dict 반환. 없으면 ValueError('NOT_FOUND')."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, name, email, is_admin FROM hospitals WHERE id = %s",
            (hospital_id,),
        )
        row = cur.fetchone()
    conn.close()
    if not row:
        raise ValueError("NOT_FOUND")
    return dict(row)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", dest="hospital_id", required=True)
    args = parser.parse_args()
    import json
    print(json.dumps(main(args.hospital_id), ensure_ascii=False, indent=2))

import argparse
import json

from backend.conn import RealDictCursor, get_db_connection


def main(hospital_id: str, date: str, r1_id: str, label: str | None = None, position: int | None = None) -> dict:
    """업데이트된 ColumnRow1 dict 반환. 없으면 ValueError('NOT_FOUND')."""
    sets = []
    params: list = []
    if label is not None:
        sets.append("label = %s")
        params.append(label)
    if position is not None:
        sets.append("position = %s")
        params.append(position)
    sets.append("updated_at = now()")

    sql = f"""
        UPDATE column_row1
        SET {", ".join(sets)}
        WHERE hospital_id = %s AND date = %s AND id = %s
        RETURNING id, date, label, position, built_in
    """
    params.extend([hospital_id, date, r1_id])

    conn = get_db_connection()
    with conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
    conn.close()

    if row is None:
        raise ValueError("NOT_FOUND")

    return {
        "id": row["id"],
        "date": row["date"].isoformat(),
        "label": row["label"],
        "position": row["position"],
        "built_in": row["built_in"],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", required=True)
    parser.add_argument("--date", required=True)
    parser.add_argument("--r1-id", required=True)
    parser.add_argument("--label")
    parser.add_argument("--position", type=int)
    args = parser.parse_args()

    result = main(args.hospital_id, args.date, args.r1_id, args.label, args.position)
    print(json.dumps(result, ensure_ascii=False, indent=2))

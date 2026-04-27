import argparse
import json
from datetime import date as date_type

from backend.conn import RealDictCursor, get_db_connection
from backend.utils.propagation import ensure_columns_for_date


def main(
    date: str,
    r2_id: str,
    label: str | None = None,
    position: int | None = None,
    row1_id: str | None = None,
) -> dict:
    """업데이트된 ColumnRow2 dict. 없으면 ValueError('NOT_FOUND')."""
    conn = get_db_connection()
    try:
        ensure_columns_for_date(conn, date)

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id FROM column_row2 WHERE date = %s AND id = %s",
                (date, r2_id),
            )
            if not cur.fetchone():
                raise ValueError("NOT_FOUND")

            sets = []
            params: list = []
            if label is not None:
                sets.append("label = %s")
                params.append(label)
            if position is not None:
                sets.append("position = %s")
                params.append(position)
            if row1_id is not None:
                cur.execute(
                    "SELECT id FROM column_row1 WHERE date = %s AND id = %s",
                    (date, row1_id),
                )
                if not cur.fetchone():
                    raise ValueError("NOT_FOUND")
                sets.append("row1_id = %s")
                params.append(row1_id)

            if sets:
                params.extend([date, r2_id])
                cur.execute(
                    f"UPDATE column_row2 SET {', '.join(sets)} "
                    "WHERE date = %s AND id = %s",
                    tuple(params),
                )

            cur.execute(
                "SELECT id, date, row1_id, label, position, built_in "
                "FROM column_row2 WHERE date = %s AND id = %s",
                (date, r2_id),
            )
            row = cur.fetchone()

        conn.commit()
    finally:
        conn.close()

    result = dict(row)
    if isinstance(result.get("date"), date_type):
        result["date"] = result["date"].isoformat()
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", required=True)
    parser.add_argument("--r2-id", required=True)
    parser.add_argument("--label")
    parser.add_argument("--position", type=int)
    parser.add_argument("--row1-id")
    args = parser.parse_args()

    result = main(
        args.date,
        args.r2_id,
        label=args.label,
        position=args.position,
        row1_id=args.row1_id,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))

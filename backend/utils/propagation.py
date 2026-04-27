# Column propagation helpers.
# Ported from demo/kanban-v1c-b.html — loadColumnsForDate(date) (line ~1163-1194).
#
# Rules (mirror demo behaviour):
#   1. If column_row1 rows exist for `date`, use them verbatim (+ matching column_row2).
#   2. Else, find the most recent prior date with column_row1 rows and use that snapshot.
#   3. Else, fall back to DEFAULT_ROW1 / DEFAULT_ROW2.
# Read paths (`get_columns_for_date`) never write to DB — the response always reports
# the requested date in its `date` field.
# Mutation paths (`ensure_columns_for_date`) materialise the chosen snapshot into DB
# so that subsequent card mutations always reference real column rows.

from datetime import date as date_type

from backend.conn import RealDictCursor, get_db_connection
from backend.utils.defaults import DEFAULT_ROW1, DEFAULT_ROW2


def _to_date_str(target_date: str | date_type) -> str:
    if isinstance(target_date, date_type):
        return target_date.isoformat()
    return target_date


def find_prev_columns_date(target_date: str | date_type) -> str | None:
    """Return the most recent date < target_date with column_row1 rows, else None."""
    date_str = _to_date_str(target_date)
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT MAX(date) AS prev_date FROM column_row1 WHERE date < %s",
            (date_str,),
        )
        row = cur.fetchone()
    conn.close()
    if not row or row["prev_date"] is None:
        return None
    return row["prev_date"].isoformat()


def _fetch_columns_at(cur, date_str: str) -> tuple[list[dict], list[dict]]:
    cur.execute(
        "SELECT id, date, label, position, built_in FROM column_row1 "
        "WHERE date = %s ORDER BY position ASC",
        (date_str,),
    )
    row1 = [dict(r) for r in cur.fetchall()]
    cur.execute(
        "SELECT id, date, row1_id, label, position, built_in FROM column_row2 "
        "WHERE date = %s ORDER BY position ASC",
        (date_str,),
    )
    row2 = [dict(r) for r in cur.fetchall()]
    return row1, row2


def _serialize_row(items: list[dict]) -> list[dict]:
    out = []
    for r in items:
        entry = dict(r)
        d = entry.get("date")
        if isinstance(d, date_type):
            entry["date"] = d.isoformat()
        out.append(entry)
    return out


def _default_snapshot(date_str: str) -> tuple[list[dict], list[dict]]:
    row1 = [
        {
            "id": item["id"],
            "date": date_str,
            "label": item["label"],
            "position": idx,
            "built_in": item["built_in"],
        }
        for idx, item in enumerate(DEFAULT_ROW1)
    ]
    row2 = [
        {
            "id": item["id"],
            "date": date_str,
            "row1_id": item["row1_id"],
            "label": item["label"],
            "position": idx,
            "built_in": item["built_in"],
        }
        for idx, item in enumerate(DEFAULT_ROW2)
    ]
    return row1, row2


def get_columns_for_date(target_date: str | date_type) -> dict:
    """Return {date, row1, row2} for `target_date`.

    Falls back to the nearest prior-date snapshot, then to DEFAULT_ROW1/2.
    The response's `date` field is always the requested date even when a prior
    snapshot is borrowed. This function never writes to DB.
    """
    date_str = _to_date_str(target_date)
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        row1, row2 = _fetch_columns_at(cur, date_str)
        if not row1:
            cur.execute(
                "SELECT MAX(date) AS prev_date FROM column_row1 WHERE date < %s",
                (date_str,),
            )
            prev = cur.fetchone()
            prev_date = prev["prev_date"] if prev else None
            if prev_date is not None:
                prev_str = prev_date.isoformat()
                row1, row2 = _fetch_columns_at(cur, prev_str)
    conn.close()

    if not row1:
        row1, row2 = _default_snapshot(date_str)
        return {"date": date_str, "row1": row1, "row2": row2}

    row1 = _serialize_row(row1)
    row2 = _serialize_row(row2)
    for r in row1:
        r["date"] = date_str
    for r in row2:
        r["date"] = date_str
    return {"date": date_str, "row1": row1, "row2": row2}


def ensure_columns_for_date(conn, target_date: str | date_type) -> None:
    """Insert column_row1/row2 rows for `target_date` if absent.

    Picks the nearest prior-date snapshot if any, otherwise DEFAULT_ROW1/2.
    Caller owns the transaction — this function does NOT call conn.commit().
    """
    date_str = _to_date_str(target_date)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT 1 FROM column_row1 WHERE date = %s LIMIT 1", (date_str,))
        if cur.fetchone():
            return

        cur.execute(
            "SELECT MAX(date) AS prev_date FROM column_row1 WHERE date < %s",
            (date_str,),
        )
        prev = cur.fetchone()
        prev_date = prev["prev_date"] if prev else None

        if prev_date is not None:
            prev_str = prev_date.isoformat()
            src_row1, src_row2 = _fetch_columns_at(cur, prev_str)
            row1_to_insert = [
                {
                    "id": r["id"],
                    "label": r["label"],
                    "built_in": r["built_in"],
                }
                for r in src_row1
            ]
            row2_to_insert = [
                {
                    "id": r["id"],
                    "row1_id": r["row1_id"],
                    "label": r["label"],
                    "built_in": r["built_in"],
                }
                for r in src_row2
            ]
        else:
            row1_to_insert = [
                {"id": r["id"], "label": r["label"], "built_in": r["built_in"]}
                for r in DEFAULT_ROW1
            ]
            row2_to_insert = [
                {
                    "id": r["id"],
                    "row1_id": r["row1_id"],
                    "label": r["label"],
                    "built_in": r["built_in"],
                }
                for r in DEFAULT_ROW2
            ]

        for idx, r in enumerate(row1_to_insert):
            cur.execute(
                "INSERT INTO column_row1 (id, date, label, position, built_in) "
                "VALUES (%s, %s, %s, %s, %s)",
                (r["id"], date_str, r["label"], idx, r["built_in"]),
            )
        for idx, r in enumerate(row2_to_insert):
            cur.execute(
                "INSERT INTO column_row2 (id, date, row1_id, label, position, built_in) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (r["id"], date_str, r["row1_id"], r["label"], idx, r["built_in"]),
            )

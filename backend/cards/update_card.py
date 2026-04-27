import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path

from backend.conn import RealDictCursor, get_db_connection
from backend.utils.defaults import SYNC_FIELDS


def main(
    card_id: str,
    name: str | None = None,
    chart: str | None = None,
    counselor: str | None = None,
    book_time: str | None = None,
    consult_time: str | None = None,
    memo: str | None = None,
    color: str | None = None,
    sync_siblings: bool = True,
) -> dict:
    """업데이트된 Card dict 반환. 없으면 ValueError('NOT_FOUND')."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # 1. SELECT 카드 (없으면 NOT_FOUND). 기존 chart 기록.
        cur.execute("SELECT * FROM cards WHERE id = %s", (card_id,))
        existing = cur.fetchone()
        if not existing:
            raise ValueError("NOT_FOUND")
        existing_chart = existing["chart"]
        existing_date = existing["date"]

        # 2. 변경할 필드만 수집 (None 아닌 것)
        incoming = {
            "name": name,
            "chart": chart,
            "counselor": counselor,
            "book_time": book_time,
            "consult_time": consult_time,
            "memo": memo,
            "color": color,
        }
        changed = {k: v for k, v in incoming.items() if v is not None}

        # 3. UPDATE (updated_at = now() 포함)
        if changed:
            set_clauses = [f"{k} = %s" for k in changed.keys()]
            set_clauses.append("updated_at = now()")
            sql = f"UPDATE cards SET {', '.join(set_clauses)} WHERE id = %s"
            params = list(changed.values()) + [card_id]
            cur.execute(sql, params)

        # 4. sibling sync
        chart_changed = chart is not None
        sync_changed = {k: v for k, v in changed.items() if k in SYNC_FIELDS and k != "chart"}
        if sync_siblings and not chart_changed and sync_changed and existing_chart:
            sib_set_clauses = [f"{k} = %s" for k in sync_changed.keys()]
            sib_set_clauses.append("updated_at = now()")
            sib_sql = (
                f"UPDATE cards SET {', '.join(sib_set_clauses)} "
                f"WHERE date = %s AND chart = %s AND id <> %s"
            )
            sib_params = list(sync_changed.values()) + [existing_date, existing_chart, card_id]
            cur.execute(sib_sql, sib_params)

        # 5. commit
        conn.commit()

        # 6. SELECT 후 dict 반환
        cur.execute("SELECT * FROM cards WHERE id = %s", (card_id,))
        card = dict(cur.fetchone())
    conn.close()

    if isinstance(card.get("date"), date_type):
        card["date"] = card["date"].isoformat()
    if isinstance(card.get("created_at"), datetime):
        card["created_at"] = card["created_at"].isoformat()
    if isinstance(card.get("updated_at"), datetime):
        card["updated_at"] = card["updated_at"].isoformat()
    return card


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--card-id", dest="card_id", required=True)
    parser.add_argument("--name", default=None)
    parser.add_argument("--chart", default=None)
    parser.add_argument("--counselor", default=None)
    parser.add_argument("--book-time", dest="book_time", default=None)
    parser.add_argument("--consult-time", dest="consult_time", default=None)
    parser.add_argument("--memo", default=None)
    parser.add_argument("--color", default=None)
    parser.add_argument("--no-sync-siblings", dest="sync_siblings", action="store_false")
    parser.set_defaults(sync_siblings=True)
    args = parser.parse_args()

    result = main(
        args.card_id,
        args.name,
        args.chart,
        args.counselor,
        args.book_time,
        args.consult_time,
        args.memo,
        args.color,
        args.sync_siblings,
    )

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

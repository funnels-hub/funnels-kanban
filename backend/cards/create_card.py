import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from backend.conn import RealDictCursor, get_db_connection
from backend.utils.defaults import DUP_ALLOWED_R1, SYNC_FIELDS
from backend.utils.propagation import ensure_columns_for_date


def main(
    date: str,
    row1_id: str,
    row2_id: str,
    time: str,
    name: str = "",
    chart: str = "",
    counselor: str = "",
    book_time: str = "",
    consult_time: str = "",
    memo: str = "",
    color: str = "",
) -> dict:
    """카드 생성. chart 중복 / 셀 점유 / chart sync 룰 적용. 생성된 Card dict 반환."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # 1. boards/columns ensure
        ensure_columns_for_date(conn, date)

        # 2. chart 중복 검사: 같은 (date, chart) 카드가 이미 있으면 거부 (그룹 무관)
        if chart:
            cur.execute(
                "SELECT 1 FROM cards WHERE date = %s AND chart = %s LIMIT 1",
                (date, chart),
            )
            if cur.fetchone():
                raise ValueError("CHART_ALREADY_EXISTS")

        # 3. 셀 점유 검증 (DUP_ALLOWED_R1은 skip)
        if row1_id not in DUP_ALLOWED_R1:
            cur.execute(
                "SELECT 1 FROM cards WHERE date = %s AND row1_id = %s AND row2_id = %s AND time = %s LIMIT 1",
                (date, row1_id, row2_id, time),
            )
            if cur.fetchone():
                raise ValueError("CELL_OCCUPIED")

        # 4. chart sync: 동일 (date, chart) sibling 1개 SELECT → 입력 빈값을 sibling 값으로 보완
        values = {
            "name": name,
            "counselor": counselor,
            "book_time": book_time,
            "consult_time": consult_time,
            "memo": memo,
            "color": color,
        }
        if chart:
            cur.execute(
                "SELECT name, counselor, book_time, consult_time, memo, color "
                "FROM cards WHERE date = %s AND chart = %s LIMIT 1",
                (date, chart),
            )
            sibling = cur.fetchone()
            if sibling:
                for field in SYNC_FIELDS:
                    if field == "chart":
                        continue
                    if values.get(field, "") == "" and sibling.get(field):
                        values[field] = sibling[field]

        # 5. 새 id
        new_id = f"c_{uuid4().hex[:12]}"

        # 6. INSERT
        cur.execute(
            "INSERT INTO cards (id, date, row1_id, row2_id, time, name, chart, "
            "counselor, book_time, consult_time, memo, color) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (
                new_id,
                date,
                row1_id,
                row2_id,
                time,
                values["name"],
                chart,
                values["counselor"],
                values["book_time"],
                values["consult_time"],
                values["memo"],
                values["color"],
            ),
        )

        # 7. commit
        conn.commit()

        # 8. SELECT 후 dict 반환
        cur.execute("SELECT * FROM cards WHERE id = %s", (new_id,))
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
    parser.add_argument("--date", required=True)
    parser.add_argument("--row1-id", dest="row1_id", required=True)
    parser.add_argument("--row2-id", dest="row2_id", required=True)
    parser.add_argument("--time", required=True)
    parser.add_argument("--name", default="")
    parser.add_argument("--chart", default="")
    parser.add_argument("--counselor", default="")
    parser.add_argument("--book-time", dest="book_time", default="")
    parser.add_argument("--consult-time", dest="consult_time", default="")
    parser.add_argument("--memo", default="")
    parser.add_argument("--color", default="")
    args = parser.parse_args()

    result = main(
        args.date,
        args.row1_id,
        args.row2_id,
        args.time,
        args.name,
        args.chart,
        args.counselor,
        args.book_time,
        args.consult_time,
        args.memo,
        args.color,
    )

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

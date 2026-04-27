import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path

from backend.conn import RealDictCursor, get_db_connection
from backend.utils.defaults import DUP_ALLOWED_R1, SINGLE_CARD_R1


def main(
    card_id: str,
    time: str | None = None,
    row1_id: str | None = None,
    row2_id: str | None = None,
) -> dict:
    """카드 이동. 룰 검증 후 이동된 Card dict 반환. None은 변경 없음."""
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # 1. SELECT 카드
        cur.execute("SELECT * FROM cards WHERE id = %s", (card_id,))
        existing = cur.fetchone()
        if not existing:
            raise ValueError("NOT_FOUND")
        existing = dict(existing)

        # 2. new_* 결정 (None이면 기존 값)
        new_time = time if time is not None else existing["time"]
        new_row1 = row1_id if row1_id is not None else existing["row1_id"]
        new_row2 = row2_id if row2_id is not None else existing["row2_id"]
        card_date = existing["date"]
        chart = existing["chart"]

        # 3. SINGLE_CARD_R1 체크: 새 row1_id가 SINGLE이고 chart 비어있지 않으면
        #    같은 (date, new_row1, chart) 카드가 자기 외에 있는지 검사
        if new_row1 in SINGLE_CARD_R1 and chart:
            cur.execute(
                "SELECT 1 FROM cards "
                "WHERE date = %s AND row1_id = %s AND chart = %s AND id != %s LIMIT 1",
                (card_date, new_row1, chart, card_id),
            )
            if cur.fetchone():
                raise ValueError("CHART_ALREADY_EXISTS")

        # 4. 셀 점유 체크 (DUP_ALLOWED_R1은 skip)
        if new_row1 not in DUP_ALLOWED_R1:
            cur.execute(
                "SELECT 1 FROM cards "
                "WHERE date = %s AND row1_id = %s AND row2_id = %s AND time = %s "
                "AND id != %s LIMIT 1",
                (card_date, new_row1, new_row2, new_time, card_id),
            )
            if cur.fetchone():
                raise ValueError("CELL_OCCUPIED")

        # 5. book_time 동기화: SINGLE_CARD_R1이고 new_time이 변경된 경우 new_time으로
        if new_row1 in SINGLE_CARD_R1 and new_time != existing["time"]:
            new_book_time = new_time
        else:
            new_book_time = existing["book_time"]

        # 6. UPDATE
        cur.execute(
            "UPDATE cards SET time = %s, row1_id = %s, row2_id = %s, "
            "book_time = %s, updated_at = NOW() WHERE id = %s",
            (new_time, new_row1, new_row2, new_book_time, card_id),
        )

        # 7. commit
        conn.commit()

        # 8. SELECT 후 dict 반환
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
    parser.add_argument("--time", default=None)
    parser.add_argument("--row1-id", dest="row1_id", default=None)
    parser.add_argument("--row2-id", dest="row2_id", default=None)
    args = parser.parse_args()

    result = main(args.card_id, args.time, args.row1_id, args.row2_id)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

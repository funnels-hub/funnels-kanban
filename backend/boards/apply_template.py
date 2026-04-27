import argparse
import json
from datetime import datetime
from pathlib import Path

from backend.boards import get_board
from backend.conn import RealDictCursor, get_db_connection


def main(date: str, template_id: str) -> dict:
    """date의 컬럼/카드를 모두 삭제하고 template_id의 row1/row2를 그 date에 INSERT.

    트랜잭션:
      1. 템플릿 SELECT (없으면 NOT_FOUND)
      2. DELETE FROM cards WHERE date
      3. DELETE FROM column_row2 WHERE date
      4. DELETE FROM column_row1 WHERE date
      5. 템플릿 row1 → INSERT (id, date, label, position=index, built_in=false)
      6. 템플릿 row2 → INSERT
      7. commit
      8. get_board(date) 반환
    """
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, name, row1, row2 FROM templates WHERE id = %s",
            (template_id,),
        )
        template = cur.fetchone()
        if template is None:
            raise ValueError("NOT_FOUND")

        cur.execute("DELETE FROM cards WHERE date = %s", (date,))
        cur.execute("DELETE FROM column_row2 WHERE date = %s", (date,))
        cur.execute("DELETE FROM column_row1 WHERE date = %s", (date,))

        for idx, item in enumerate(template["row1"]):
            cur.execute(
                "INSERT INTO column_row1 (id, date, label, position, built_in) "
                "VALUES (%s, %s, %s, %s, %s)",
                (item["id"], date, item["label"], idx, False),
            )
        for idx, item in enumerate(template["row2"]):
            cur.execute(
                "INSERT INTO column_row2 (id, date, row1_id, label, position, built_in) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (item["id"], date, item["row1_id"], item["label"], idx, False),
            )

        conn.commit()
    conn.close()

    return get_board.main(date)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", required=True)
    parser.add_argument("--template-id", dest="template_id", required=True)
    args = parser.parse_args()

    result = main(args.date, args.template_id)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

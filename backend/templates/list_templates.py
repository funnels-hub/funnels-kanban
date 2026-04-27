import argparse
import json
from datetime import date as date_type
from datetime import datetime
from pathlib import Path

from psycopg2.extras import Json

from backend.conn import RealDictCursor, get_db_connection
from backend.utils.defaults import DEFAULT_ROW1, DEFAULT_ROW2


def _serialize(row: dict) -> dict:
    out = dict(row)
    for key in ("created_at", "updated_at"):
        v = out.get(key)
        if isinstance(v, (datetime, date_type)):
            out[key] = v.isoformat()
    return out


def main(hospital_id: str) -> list[dict]:
    """해당 병원의 템플릿 목록 (created_at desc).

    첫 호출 시 해당 병원의 'tpl-default' 시드:
      name="기본 템플릿", is_default=true
      row1=[{id,label}], row2=[{id,row1_id,label}]
    """
    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM templates WHERE hospital_id = %s",
            (hospital_id,),
        )
        cnt = cur.fetchone()["cnt"]
        if cnt == 0:
            row1 = [{"id": r["id"], "label": r["label"]} for r in DEFAULT_ROW1]
            row2 = [
                {"id": r["id"], "row1_id": r["row1_id"], "label": r["label"]}
                for r in DEFAULT_ROW2
            ]
            cur.execute(
                "INSERT INTO templates (hospital_id, id, name, row1, row2, is_default) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (
                    hospital_id,
                    "tpl-default",
                    "기본 템플릿",
                    Json(row1),
                    Json(row2),
                    True,
                ),
            )
            conn.commit()

        cur.execute(
            "SELECT id, name, row1, row2, is_default, created_at, updated_at "
            "FROM templates WHERE hospital_id = %s ORDER BY created_at DESC",
            (hospital_id,),
        )
        rows = [_serialize(dict(r)) for r in cur.fetchall()]
    conn.close()
    return rows


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", required=True)
    args = parser.parse_args()

    result = main(args.hospital_id)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

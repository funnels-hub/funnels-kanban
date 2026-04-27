import argparse
import json
from datetime import datetime
from pathlib import Path

from backend.cards import list_cards
from backend.utils.propagation import get_columns_for_date


def main(date: str) -> dict:
    """BoardSnapshot dict: {date, columns: ColumnsBundle, cards: Card[]}.

    columns은 propagation 적용, cards는 list_cards 사용.
    """
    columns = get_columns_for_date(date)
    cards = list_cards.main(date)
    return {"date": date, "columns": columns, "cards": cards}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", required=True)
    args = parser.parse_args()

    result = main(args.date)

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Saved: {output_file}")

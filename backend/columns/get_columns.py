import argparse
import json

from backend.utils.propagation import get_columns_for_date


def main(hospital_id: str, date: str) -> dict:
    """ColumnsBundle dict: {date, row1: [...], row2: [...]}.

    propagation 적용: 해당 date 컬럼 없으면 가장 최근 prior date 또는 DEFAULT.
    """
    return get_columns_for_date(hospital_id, date)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", required=True)
    parser.add_argument("--date", required=True)
    args = parser.parse_args()

    result = main(args.hospital_id, args.date)
    print(json.dumps(result, ensure_ascii=False, indent=2))

# Default constants ported from demo/kanban-v1c-b.html (line ~795-855).
# Used by all logic files (boards, columns, cards, templates).

# ---------- Row1 (대분류) defaults ----------
# Demo line 814-822
DEFAULT_ROW1 = [
    {"id": "r1_구환", "label": "구환상담", "built_in": True},
    {"id": "r1_신환", "label": "신환상담", "built_in": True},
    {"id": "r1_예진", "label": "예진현황", "built_in": True},
    {"id": "r1_임플", "label": "임플상담", "built_in": True},
    {"id": "r1_일반", "label": "일반상담", "built_in": True},
    {"id": "r1_전화", "label": "전화상담", "built_in": True},
]

# ---------- Row2 (leaf) defaults ----------
# Demo line 823-855 (28개)
DEFAULT_ROW2 = [
    {"id": "r2_구환_김수지", "row1_id": "r1_구환", "label": "김수지", "built_in": True},
    {"id": "r2_구환_라근주", "row1_id": "r1_구환", "label": "라근주", "built_in": True},
    {"id": "r2_구환_유소연", "row1_id": "r1_구환", "label": "유소연", "built_in": True},
    {"id": "r2_신환_김수지", "row1_id": "r1_신환", "label": "김수지", "built_in": True},
    {"id": "r2_신환_라근주", "row1_id": "r1_신환", "label": "라근주", "built_in": True},
    {"id": "r2_신환_유소연", "row1_id": "r1_신환", "label": "유소연", "built_in": True},
    {"id": "r2_예진_예진완", "row1_id": "r1_예진", "label": "예진완", "built_in": True},
    {"id": "r2_예진_예진실", "row1_id": "r1_예진", "label": "예진실", "built_in": True},
    {"id": "r2_예진_사진완", "row1_id": "r1_예진", "label": "사진완", "built_in": True},
    {"id": "r2_예진_신환접", "row1_id": "r1_예진", "label": "신환접", "built_in": True},
    {"id": "r2_임플_아웃", "row1_id": "r1_임플", "label": "아웃", "built_in": True},
    {"id": "r2_임플_소개", "row1_id": "r1_임플", "label": "소개", "built_in": True},
    {"id": "r2_임플_제휴", "row1_id": "r1_임플", "label": "제휴", "built_in": True},
    {"id": "r2_임플_그외", "row1_id": "r1_임플", "label": "그외", "built_in": True},
    {"id": "r2_임플_재방문", "row1_id": "r1_임플", "label": "재방문", "built_in": True},
    {"id": "r2_임플_임플불가", "row1_id": "r1_임플", "label": "임플불가", "built_in": True},
    {"id": "r2_임플_날변이탈", "row1_id": "r1_임플", "label": "날변·이탈", "built_in": True},
    {"id": "r2_임플_상담거부", "row1_id": "r1_임플", "label": "상담거부", "built_in": True},
    {"id": "r2_일반_아웃", "row1_id": "r1_일반", "label": "아웃", "built_in": True},
    {"id": "r2_일반_소개", "row1_id": "r1_일반", "label": "소개", "built_in": True},
    {"id": "r2_일반_제휴", "row1_id": "r1_일반", "label": "제휴", "built_in": True},
    {"id": "r2_일반_그외", "row1_id": "r1_일반", "label": "그외", "built_in": True},
    {"id": "r2_일반_재방문", "row1_id": "r1_일반", "label": "재방문", "built_in": True},
    {"id": "r2_전화_김수지", "row1_id": "r1_전화", "label": "김수지", "built_in": True},
    {"id": "r2_전화_라근주", "row1_id": "r1_전화", "label": "라근주", "built_in": True},
    {"id": "r2_전화_유소연", "row1_id": "r1_전화", "label": "유소연", "built_in": True},
]

# ---------- Per-row1 leaf width ----------
# Demo line 799-803
R1_LEAF_WIDTH = {
    "r1_구환": 88,
    "r1_신환": 88,
    "r1_예진": 56,
    "r1_임플": 52,
    "r1_일반": 52,
    "r1_전화": 76,
}
DEFAULT_LEAF_WIDTH = 64
ADD_CELL_WIDTH = 30

# ---------- Business-rule group sets ----------
# Demo line 809-810
SINGLE_CARD_R1 = ["r1_구환", "r1_신환"]
DUP_ALLOWED_R1 = ["r1_임플", "r1_일반"]

# ---------- Sibling sync fields ----------
# Demo SYNC_FIELDS
SYNC_FIELDS = ["name", "counselor", "book_time", "consult_time", "memo", "color"]

# ---------- Time slots: 9:00 ~ 20:30, 30-min intervals (24 slots) ----------
TIME_SLOTS = []
for h in range(9, 21):
    TIME_SLOTS.append(f"{h}:00")
    TIME_SLOTS.append(f"{h}:30")

# ---------- Counselors ----------
COUNSELORS = ["김수지", "라근주", "유소연"]

# ---------- Color palette (9 colors) ----------
COLOR_PALETTE = [
    "#fde68a", "#fca5a5", "#a7f3d0",
    "#bfdbfe", "#c4b5fd", "#f9a8d4",
    "#fdba74", "#86efac", "#fcd34d",
]

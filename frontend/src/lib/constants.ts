export const DEFAULT_ROW1 = [
  { id: "r1_구환", label: "구환상담", built_in: true },
  { id: "r1_신환", label: "신환상담", built_in: true },
  { id: "r1_예진", label: "예진현황", built_in: true },
  { id: "r1_임플", label: "임플상담", built_in: true },
  { id: "r1_일반", label: "일반상담", built_in: true },
  { id: "r1_전화", label: "전화상담", built_in: true },
] as const;

export const DEFAULT_ROW2 = [
  { id: "r2_구환_김수지", row1_id: "r1_구환", label: "김수지", built_in: true },
  { id: "r2_구환_라근주", row1_id: "r1_구환", label: "라근주", built_in: true },
  { id: "r2_구환_유소연", row1_id: "r1_구환", label: "유소연", built_in: true },
  { id: "r2_신환_김수지", row1_id: "r1_신환", label: "김수지", built_in: true },
  { id: "r2_신환_라근주", row1_id: "r1_신환", label: "라근주", built_in: true },
  { id: "r2_신환_유소연", row1_id: "r1_신환", label: "유소연", built_in: true },
  { id: "r2_예진_예진완", row1_id: "r1_예진", label: "예진완", built_in: true },
  { id: "r2_예진_예진실", row1_id: "r1_예진", label: "예진실", built_in: true },
  { id: "r2_예진_사진완", row1_id: "r1_예진", label: "사진완", built_in: true },
  { id: "r2_예진_신환접", row1_id: "r1_예진", label: "신환접", built_in: true },
  { id: "r2_임플_아웃", row1_id: "r1_임플", label: "아웃", built_in: true },
  { id: "r2_임플_소개", row1_id: "r1_임플", label: "소개", built_in: true },
  { id: "r2_임플_제휴", row1_id: "r1_임플", label: "제휴", built_in: true },
  { id: "r2_임플_그외", row1_id: "r1_임플", label: "그외", built_in: true },
  { id: "r2_임플_재방문", row1_id: "r1_임플", label: "재방문", built_in: true },
  { id: "r2_임플_임플불가", row1_id: "r1_임플", label: "임플불가", built_in: true },
  { id: "r2_임플_날변이탈", row1_id: "r1_임플", label: "날변·이탈", built_in: true },
  { id: "r2_임플_상담거부", row1_id: "r1_임플", label: "상담거부", built_in: true },
  { id: "r2_일반_아웃", row1_id: "r1_일반", label: "아웃", built_in: true },
  { id: "r2_일반_소개", row1_id: "r1_일반", label: "소개", built_in: true },
  { id: "r2_일반_제휴", row1_id: "r1_일반", label: "제휴", built_in: true },
  { id: "r2_일반_그외", row1_id: "r1_일반", label: "그외", built_in: true },
  { id: "r2_일반_재방문", row1_id: "r1_일반", label: "재방문", built_in: true },
  { id: "r2_전화_김수지", row1_id: "r1_전화", label: "김수지", built_in: true },
  { id: "r2_전화_라근주", row1_id: "r1_전화", label: "라근주", built_in: true },
  { id: "r2_전화_유소연", row1_id: "r1_전화", label: "유소연", built_in: true },
] as const;

export const R1_LEAF_WIDTH: Record<string, number> = {
  r1_구환: 110, r1_신환: 110, r1_예진: 110,
  r1_임플: 110, r1_일반: 110, r1_전화: 110,
};
export const DEFAULT_LEAF_WIDTH = 110;
export const ADD_CELL_WIDTH = 30;
export const TIME_CELL_WIDTH = 64;

export const SINGLE_CARD_R1 = new Set(["r1_구환", "r1_신환"]);
export const DUP_ALLOWED_R1 = new Set(["r1_임플", "r1_일반"]);

export const SYNC_FIELDS = ["name", "counselor", "book_time", "consult_time", "memo", "color"] as const;

export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 9; h <= 20; h++) {
    slots.push(`${h}:00`);
    slots.push(`${h}:30`);
  }
  return slots;
})();

export const COUNSELORS = ["김수지", "라근주", "유소연"] as const;

export const COLOR_PALETTE = [
  // 기존 옅은 톤 (9)
  "#fde68a", "#fca5a5", "#a7f3d0",
  "#bfdbfe", "#c4b5fd", "#f9a8d4",
  "#fdba74", "#86efac", "#fcd34d",
  // 진한 톤 (8) — 같은 hue family 다른 채도
  "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#3b82f6",
  "#8b5cf6", "#ec4899",
  // 중간 톤 / 추가 hue (7)
  "#f59e0b", "#10b981", "#0ea5e9",
  "#6366f1", "#a855f7", "#d946ef",
  "#64748b",
];

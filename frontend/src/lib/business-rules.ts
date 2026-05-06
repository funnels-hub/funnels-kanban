import type { Card } from "@/types/cards";
import { SINGLE_CARD_R1 } from "./constants";

export function isTimeEditableGroup(row1_id: string): boolean {
  return SINGLE_CARD_R1.has(row1_id);
}

export function isCopyable(card: Card): boolean {
  return SINGLE_CARD_R1.has(card.row1_id);
}

export function isPasteAllowed(target_row1_id: string): boolean {
  return !SINGLE_CARD_R1.has(target_row1_id);
}

export function cellHasOtherCard(
  cards: Card[],
  zone: { time: string; row1_id: string; row2_id: string },
  excludeId?: string
): boolean {
  return cards.some(
    (c) =>
      c.id !== excludeId &&
      c.time === zone.time &&
      c.row1_id === zone.row1_id &&
      c.row2_id === zone.row2_id
  );
}

export function findSiblingCards(cards: Card[], chart: string, excludeId?: string): Card[] {
  if (!chart) return [];
  return cards.filter((c) => c.chart === chart && c.id !== excludeId);
}

export function isChartTakenByOther(
  cards: Card[],
  chart: string,
  row1_id: string,
  _row2_id: string,
  _time: string,
  excludeId?: string
): boolean {
  if (!chart) return false;
  if (!SINGLE_CARD_R1.has(row1_id)) return false;
  return cards.some(
    (c) => c.id !== excludeId && c.chart === chart && SINGLE_CARD_R1.has(c.row1_id)
    // single-card 그룹은 그룹 안에서 1개만 허용
  );
}

export function formatNowHHMM(): string {
  const d = new Date();
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function parseInlineAdd(input: string): { name: string; chart: string } {
  // 데모 parseInline: "이름 차트번호" — 마지막 토큰이 숫자면 chart, 나머지는 name
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { name: "", chart: "" };
  const last = tokens[tokens.length - 1];
  if (/^\d+$/.test(last) && tokens.length > 1) {
    return { name: tokens.slice(0, -1).join(" "), chart: last };
  }
  return { name: tokens.join(" "), chart: "" };
}

export function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

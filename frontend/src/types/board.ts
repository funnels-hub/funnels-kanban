import type { ColumnsBundle } from "./columns";
import type { Card } from "./cards";

export interface BoardSnapshot {
  date: string;
  columns: ColumnsBundle;
  cards: Card[];
}

export interface ApplyTemplateRequest {
  template_id: string;
}

export interface ImplantLeafCount {
  label: string;
  count: number;
}

export interface ImplantStats {
  date: string;
  total: number;
  by_leaf: Record<string, ImplantLeafCount>;
}

export interface Defaults {
  row1: { id: string; label: string; built_in: boolean }[];
  row2: { id: string; row1_id: string; label: string; built_in: boolean }[];
  counselors: string[];
  time_slots: string[];
  r1_leaf_width: Record<string, number>;
  single_card_r1: string[];
  dup_allowed_r1: string[];
  color_palette: string[];
}

export interface TemplateColumnItem {
  id: string;
  label: string;
}

export interface TemplateLeafItem {
  id: string;
  row1_id: string;
  label: string;
}

export interface Template {
  id: string;
  name: string;
  row1: TemplateColumnItem[];
  row2: TemplateLeafItem[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateCreate {
  name: string;
  source_date?: string;
}

export interface TemplateUpdate {
  name?: string;
  row1?: TemplateColumnItem[];
  row2?: TemplateLeafItem[];
}

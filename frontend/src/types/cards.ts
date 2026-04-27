export interface Card {
  id: string;
  date: string;
  row1_id: string;
  row2_id: string;
  time: string;
  name: string;
  chart: string;
  counselor: string;
  book_time: string;
  consult_time: string;
  memo: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CardCreate {
  date: string;
  row1_id: string;
  row2_id: string;
  time: string;
  name?: string;
  chart?: string;
  counselor?: string;
  book_time?: string;
  consult_time?: string;
  memo?: string;
  color?: string;
}

export interface CardUpdate {
  name?: string;
  chart?: string;
  counselor?: string;
  book_time?: string;
  consult_time?: string;
  memo?: string;
  color?: string;
  sync_siblings?: boolean;
}

export interface CardMove {
  time?: string;
  row1_id?: string;
  row2_id?: string;
}

/**
 * Column types for the kanban board.
 *
 * 1:1 mapping of `api.yaml` schemas:
 *   - ColumnRow1, ColumnRow1Create, ColumnRow1Update
 *   - ColumnRow2, ColumnRow2Create, ColumnRow2Update
 *   - ColumnsBundle
 *   - ReorderRequest
 *
 * `date` is a YYYY-MM-DD string (OpenAPI `format: date`).
 */

/** Top-level (row1) column for a given date. */
export interface ColumnRow1 {
  /** row1 column ID, e.g. `r1_신환`. */
  id: string;
  /** Date the column belongs to (YYYY-MM-DD). */
  date: string;
  /** Display label, e.g. `신환상담`. */
  label: string;
  /** Display order (0-based). */
  position: number;
  /** System built-in column flag. `true` means non-deletable. */
  built_in: boolean;
}

/** Payload for creating a new row1 column. */
export interface ColumnRow1Create {
  /** Label for the new column. */
  label: string;
  /** Display order. If omitted, the column is appended last. */
  position?: number;
}

/** Patch payload for updating a row1 column. */
export interface ColumnRow1Update {
  label?: string;
  position?: number;
}

/** Leaf (row2) column under a row1 column for a given date. */
export interface ColumnRow2 {
  /** row2 column ID, e.g. `r2_임플_상`. */
  id: string;
  /** Date the column belongs to (YYYY-MM-DD). */
  date: string;
  /** Parent row1 column ID. */
  row1_id: string;
  /** Display label, e.g. `상`. */
  label: string;
  /** Display order (0-based). */
  position: number;
  /** System built-in column flag. `true` means non-deletable. */
  built_in: boolean;
}

/** Payload for creating a new row2 column. */
export interface ColumnRow2Create {
  /** Parent row1 column ID. */
  row1_id: string;
  /** Label for the new leaf column. */
  label: string;
  /** Display order. If omitted, the column is appended last. */
  position?: number;
}

/** Patch payload for updating a row2 column. */
export interface ColumnRow2Update {
  label?: string;
  position?: number;
  /** Move the leaf to a different parent row1 column. */
  row1_id?: string;
}

/** Combined column structure (row1 + row2) for a given date. */
export interface ColumnsBundle {
  /** Date of the column bundle (YYYY-MM-DD). */
  date: string;
  /** All row1 columns for the date. */
  row1: ColumnRow1[];
  /** All row2 columns for the date. */
  row2: ColumnRow2[];
}

/**
 * Request body for column reordering.
 *
 * At least one of `row1_ids` / `row2_ids` must be provided.
 * - `row1_ids`: new ordering for row1 columns.
 * - `row2_ids`: per-row1 mapping to a new ordering of its row2 columns.
 */
export interface ReorderRequest {
  /** Ordered list of row1 column IDs. */
  row1_ids?: string[];
  /** Map of row1 ID -> ordered list of its row2 column IDs. */
  row2_ids?: Record<string, string[]>;
}

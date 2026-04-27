import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useCurrentDate } from "@/contexts/DateContext";
import { api } from "@/lib/api-client";
import type { BoardSnapshot } from "@/types/board";
import type {
  ColumnRow1,
  ColumnRow1Create,
  ColumnRow1Update,
  ColumnRow2,
  ColumnRow2Create,
  ColumnRow2Update,
  ReorderRequest,
} from "@/types/columns";
import type { Card, CardCreate, CardMove, CardUpdate } from "@/types/cards";

type BoardStatus = "idle" | "loading" | "done" | "error";

interface BoardContextValue {
  snapshot: BoardSnapshot | null;
  status: BoardStatus;
  error: string | null;
  refetch: () => Promise<void>;
  // columns
  addRow1: (input: ColumnRow1Create) => Promise<ColumnRow1>;
  renameRow1: (r1Id: string, input: ColumnRow1Update) => Promise<ColumnRow1>;
  deleteRow1: (r1Id: string) => Promise<void>;
  addRow2: (input: ColumnRow2Create) => Promise<ColumnRow2>;
  renameRow2: (r2Id: string, input: ColumnRow2Update) => Promise<ColumnRow2>;
  deleteRow2: (r2Id: string) => Promise<void>;
  reorder: (input: ReorderRequest) => Promise<void>;
  // cards
  createCard: (input: CardCreate) => Promise<Card>;
  updateCard: (cardId: string, input: CardUpdate) => Promise<Card>;
  moveCard: (cardId: string, input: CardMove) => Promise<Card>;
  deleteCard: (cardId: string) => Promise<void>;
  // template apply
  applyTemplate: (templateId: string) => Promise<void>;
  // sibling lookup
  getCardsByChart: (chart: string) => Promise<Card[]>;
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const { date } = useCurrentDate();
  const [snapshot, setSnapshot] = useState<BoardSnapshot | null>(null);
  const [status, setStatus] = useState<BoardStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await api.get<BoardSnapshot>(`/api/boards/${date}`);
      setSnapshot(data);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown");
      setStatus("error");
    }
  }, [date]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // ---------- columns ----------
  const addRow1 = useCallback(
    async (input: ColumnRow1Create) => {
      const created = await api.post<ColumnRow1>(
        `/api/columns/${date}/row1`,
        input,
      );
      await refetch();
      return created;
    },
    [date, refetch],
  );

  const renameRow1 = useCallback(
    async (r1Id: string, input: ColumnRow1Update) => {
      const updated = await api.patch<ColumnRow1>(
        `/api/columns/${date}/row1/${r1Id}`,
        input,
      );
      await refetch();
      return updated;
    },
    [date, refetch],
  );

  const deleteRow1 = useCallback(
    async (r1Id: string) => {
      await api.delete(`/api/columns/${date}/row1/${r1Id}`);
      await refetch();
    },
    [date, refetch],
  );

  const addRow2 = useCallback(
    async (input: ColumnRow2Create) => {
      const created = await api.post<ColumnRow2>(
        `/api/columns/${date}/row2`,
        input,
      );
      await refetch();
      return created;
    },
    [date, refetch],
  );

  const renameRow2 = useCallback(
    async (r2Id: string, input: ColumnRow2Update) => {
      const updated = await api.patch<ColumnRow2>(
        `/api/columns/${date}/row2/${r2Id}`,
        input,
      );
      await refetch();
      return updated;
    },
    [date, refetch],
  );

  const deleteRow2 = useCallback(
    async (r2Id: string) => {
      await api.delete(`/api/columns/${date}/row2/${r2Id}`);
      await refetch();
    },
    [date, refetch],
  );

  const reorder = useCallback(
    async (input: ReorderRequest) => {
      await api.put(`/api/columns/${date}/reorder`, input);
      await refetch();
    },
    [date, refetch],
  );

  // ---------- cards ----------
  const createCard = useCallback(
    async (input: CardCreate) => {
      const card = await api.post<Card>("/api/cards", { ...input, date });
      await refetch();
      return card;
    },
    [date, refetch],
  );

  const updateCard = useCallback(
    async (cardId: string, input: CardUpdate) => {
      const card = await api.patch<Card>(`/api/cards/${cardId}`, input);
      await refetch();
      return card;
    },
    [refetch],
  );

  const moveCard = useCallback(
    async (cardId: string, input: CardMove) => {
      const card = await api.patch<Card>(`/api/cards/${cardId}/move`, input);
      await refetch();
      return card;
    },
    [refetch],
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      await api.delete(`/api/cards/${cardId}`);
      await refetch();
    },
    [refetch],
  );

  // ---------- template ----------
  const applyTemplate = useCallback(
    async (templateId: string) => {
      await api.post(`/api/boards/${date}/apply-template`, {
        template_id: templateId,
      });
      await refetch();
    },
    [date, refetch],
  );

  // ---------- sibling lookup ----------
  const getCardsByChart = useCallback(
    async (chart: string) => {
      return api.get<Card[]>(
        `/api/cards/by-chart?chart=${encodeURIComponent(chart)}&date=${date}`,
      );
    },
    [date],
  );

  const value: BoardContextValue = {
    snapshot,
    status,
    error,
    refetch,
    addRow1,
    renameRow1,
    deleteRow1,
    addRow2,
    renameRow2,
    deleteRow2,
    reorder,
    createCard,
    updateCard,
    moveCard,
    deleteCard,
    applyTemplate,
    getCardsByChart,
  };

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}

export function useBoard(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used within BoardProvider");
  return ctx;
}

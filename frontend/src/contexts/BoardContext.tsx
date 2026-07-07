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
  refetch: (opts?: { silent?: boolean }) => Promise<void>;
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

  const refetch = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!silent) {
        setStatus("loading");
        setError(null);
      }
      try {
        const data = await api.get<BoardSnapshot>(`/api/boards/${date}`);
        setSnapshot(data);
        if (!silent) setStatus("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown");
        if (!silent) setStatus("error");
      }
    },
    [date],
  );

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

  // ---------- cards (optimistic + response-merge, no refetch) ----------
  const createCard = useCallback(
    async (input: CardCreate) => {
      const card = await api.post<Card>("/api/cards", { ...input, date });
      setSnapshot((prev) =>
        prev ? { ...prev, cards: [...prev.cards.filter((c) => c.id !== card.id), card] } : prev,
      );
      return card;
    },
    [date],
  );

  const updateCard = useCallback(
    async (cardId: string, input: CardUpdate) => {
      // 낙관적 업데이트: 서버 응답을 기다리지 않고 로컬 즉시 반영
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              cards: prev.cards.map((c) =>
                c.id === cardId ? { ...c, ...input } : c,
              ),
            }
          : prev,
      );
      const card = await api.patch<Card>(`/api/cards/${cardId}`, input);
      // 서버 정답으로 최종 머지 (sync_siblings 등 서버측 부수효과 반영)
      setSnapshot((prev) => {
        if (!prev) return prev;
        const cards = prev.cards.map((c) => (c.id === card.id ? card : c));
        // sync_siblings=true 인 경우 같은 chart 형제도 서버가 갱신했을 수 있으니
        // 형제 카드에만 국한된 필드는 백그라운드 refetch로 보정
        return { ...prev, cards };
      });
      if (input.sync_siblings) {
        // 형제 동기화가 필요한 경우에만 조용히 뒷정리 (UI 블로킹 안 함)
        void refetch({ silent: true });
      }
      return card;
    },
    [refetch],
  );

  const moveCard = useCallback(
    async (cardId: string, input: CardMove) => {
      // 낙관적 이동만 반영. 서버 응답 후 재머지는 하지 않음
      // (위치 필드는 낙관적 값이 이미 정답이며, 재머지는 뒤늦은 리렌더로 카드가 다시 튀는 착시를 유발함)
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              cards: prev.cards.map((c) =>
                c.id === cardId ? { ...c, ...input } : c,
              ),
            }
          : prev,
      );
      const card = await api.patch<Card>(`/api/cards/${cardId}/move`, input);
      return card;
    },
    [],
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      setSnapshot((prev) =>
        prev ? { ...prev, cards: prev.cards.filter((c) => c.id !== cardId) } : prev,
      );
      await api.delete(`/api/cards/${cardId}`);
    },
    [],
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

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SelectedCell {
  row1_id: string;
  row2_id: string;
  time: string;
}

interface SelectionContextValue {
  selectedCardId: string | null;
  selectedCell: SelectedCell | null;
  copiedCardId: string | null;
  selectCard: (id: string | null) => void;
  selectCell: (cell: SelectedCell | null) => void;
  copyCard: (id: string | null) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCell, setSelectedCellState] = useState<SelectedCell | null>(null);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

  const selectCard = useCallback((id: string | null) => {
    setSelectedCardId(id);
    setSelectedCellState(null);
  }, []);

  const selectCell = useCallback((cell: SelectedCell | null) => {
    setSelectedCellState(cell);
    setSelectedCardId(null);
  }, []);

  const copyCard = useCallback((id: string | null) => {
    setCopiedCardId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCardId(null);
    setSelectedCellState(null);
    setCopiedCardId(null);
  }, []);

  return (
    <SelectionContext.Provider
      value={{
        selectedCardId,
        selectedCell,
        copiedCardId,
        selectCard,
        selectCell,
        copyCard,
        clearSelection,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within SelectionProvider");
  return ctx;
}

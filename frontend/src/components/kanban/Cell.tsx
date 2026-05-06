import { useState } from "react";
import type { Card } from "@/types/cards";
import { useSelection } from "@/contexts/SelectionContext";
import { Chip } from "./Chip";
import { InlineAddInput } from "./InlineAddInput";

export function Cell({
  row1Id,
  row2Id,
  time,
  cards,
  groupIndex: _groupIndex,
  isFirstLeaf,
}: {
  row1Id: string;
  row2Id: string;
  time: string;
  cards: Card[];
  groupIndex: number;
  isFirstLeaf: boolean;
}) {
  const { selectedCell, selectCell } = useSelection();
  const [adding, setAdding] = useState(false);

  const isSelected =
    selectedCell?.row1_id === row1Id &&
    selectedCell?.row2_id === row2Id &&
    selectedCell?.time === time;
  const empty = cards.length === 0;
  const canAddInline = true;

  return (
    <div
      className={`cell ${empty ? "cell-empty" : ""} ${isSelected ? "is-selected" : ""} ${isFirstLeaf ? "col-sep-l" : ""}`}
      data-row1={row1Id}
      data-row2={row2Id}
      data-time={time}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest(".chip") || target.closest(".inline-add-input")) return;
        selectCell({ row1_id: row1Id, row2_id: row2Id, time });
      }}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest(".chip") || target.closest(".inline-add-input")) return;
        if (!canAddInline) return;
        setAdding(true);
      }}
    >
      <div className="flex flex-col gap-0.5 h-full">
        {cards.map((c) => (
          <Chip key={c.id} card={c} />
        ))}
      </div>
      {adding && (
        <InlineAddInput
          row1Id={row1Id}
          row2Id={row2Id}
          time={time}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}

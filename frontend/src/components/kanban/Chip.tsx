import { useState } from "react";
import type { Card } from "@/types/cards";
import { useSelection } from "@/contexts/SelectionContext";
import { useBoard } from "@/contexts/BoardContext";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { isCopyable, hexToRgba } from "@/lib/business-rules";
import { openCardPanel } from "@/hooks/useChipPanelOpener";
import { useConfirm } from "@/hooks/useConfirm";

export function Chip({ card }: { card: Card }) {
  const { selectedCardId, selectCard, copyCard } = useSelection();
  const { deleteCard } = useBoard();
  const confirm = useConfirm();
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const selected = selectedCardId === card.id;

  const style: React.CSSProperties = card.color
    ? { borderLeftColor: card.color, background: hexToRgba(card.color, 0.15) }
    : {};

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectCard(card.id);
  };
  const handleDouble = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectCard(card.id);
    openCardPanel();
  };
  const handleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectCard(card.id);
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const items: ContextMenuItem[] = [
    { label: "편집", onClick: () => openCardPanel() },
    { label: "복사 (Ctrl+C)", onClick: () => copyCard(card.id), disabled: !isCopyable(card) },
    { label: "삭제 (Del)", destructive: true, onClick: async () => {
      const ok = await confirm({ message: `"${card.name || card.chart || "(빈 카드)"}" 카드를 삭제할까요?`, danger: true });
      if (ok) {
        await deleteCard(card.id);
      }
    } },
  ];

  const name = card.name || "";
  const chart = card.chart || "";
  const fallback = !name && !chart ? "(빈 카드)" : "";

  return (
    <>
      <div
        className={`chip ${selected ? "is-selected" : ""}`}
        style={style}
        draggable
        onClick={handleClick}
        onDoubleClick={handleDouble}
        onContextMenu={handleContext}
        onDragStart={handleDragStart}
        data-card-id={card.id}
      >
        {fallback ? (
          <div className="chip-name text-muted-foreground">{fallback}</div>
        ) : (
          <>
            <div className="chip-name">{name || "·"}</div>
            <div className="chip-chart">{chart || "·"}</div>
          </>
        )}
      </div>
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={items} onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}

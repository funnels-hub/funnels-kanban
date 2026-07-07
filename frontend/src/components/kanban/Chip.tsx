import { useState } from "react";
import type { Card } from "@/types/cards";
import { useSelection } from "@/contexts/SelectionContext";
import { useBoard } from "@/contexts/BoardContext";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { isCopyable } from "@/lib/business-rules";
import { openCardPanel } from "@/hooks/useChipPanelOpener";
import { useConfirm } from "@/hooks/useConfirm";

export function Chip({ card }: { card: Card }) {
  const { selectedCardId, selectCard, copyCard } = useSelection();
  const { deleteCard } = useBoard();
  const confirm = useConfirm();
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const selected = selectedCardId === card.id;

  const style: React.CSSProperties = card.color
    ? { background: card.color }
    : {};
  // 배경색 명도로 텍스트 색상 자동 전환 (WCAG 상대 휘도 근사)
  const isDarkBg = (() => {
    const hex = card.color?.trim();
    if (!hex || !hex.startsWith("#")) return false;
    const h = hex.length === 4
      ? hex.slice(1).split("").map((c) => parseInt(c + c, 16))
      : [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    if (h.some((n) => Number.isNaN(n))) return false;
    const [r, g, b] = h;
    // relative luminance
    const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return L < 0.55;
  })();

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
    // native drag ghost 의 원위치 스냅백 애니메이션이 "카드가 원래 자리로 되돌아갔다 튀는" 착시를
    // 유발하므로, 투명 1px 이미지로 ghost 를 숨긴다. 낙관적 업데이트가 이미 드롭 즉시 카드를 새 셀로 옮김.
    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    e.dataTransfer.setDragImage(img, 0, 0);
    (e.currentTarget as HTMLElement).classList.add("is-dragging");
  };
  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove("is-dragging");
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
        className={`chip ${selected ? "is-selected" : ""} ${isDarkBg ? "is-dark-bg" : ""}`}
        style={style}
        draggable
        onClick={handleClick}
        onDoubleClick={handleDouble}
        onContextMenu={handleContext}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
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

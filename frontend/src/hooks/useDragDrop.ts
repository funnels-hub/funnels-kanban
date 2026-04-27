import { useEffect, useRef } from "react";
import { useBoard } from "@/contexts/BoardContext";
import { useToast } from "@/contexts/ToastContext";

export function useDragDrop() {
  const { moveCard } = useBoard();
  const { showToast } = useToast();
  const ref = useRef<HTMLElement | null>(null);

  // attach to a container element (KanbanGrid wrapper)
  const attachRef = (el: HTMLElement | null) => {
    ref.current = el;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    };

    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      const cardId = e.dataTransfer?.getData("text/plain");
      if (!cardId) return;
      const target = (e.target as HTMLElement).closest("[data-row1][data-row2][data-time]") as HTMLElement | null;
      if (!target) return;
      const row1_id = target.dataset.row1!;
      const row2_id = target.dataset.row2!;
      const time = target.dataset.time!;
      try {
        await moveCard(cardId, { row1_id, row2_id, time });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "오류";
        if (msg.includes("CELL_OCCUPIED")) showToast("이미 카드가 있는 셀입니다", "error");
        else if (msg.includes("CHART_ALREADY_EXISTS")) showToast("같은 차트가 그룹에 이미 있습니다", "error");
        else showToast(msg, "error");
      }
    };

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
    };
  }, [moveCard, showToast]);

  return { attachRef };
}

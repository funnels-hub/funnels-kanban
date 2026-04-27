import { useCallback, useRef } from "react";
import { useBoard } from "@/contexts/BoardContext";
import { useToast } from "@/contexts/ToastContext";

export function useDragDrop() {
  const { moveCard } = useBoard();
  const { showToast } = useToast();

  // 최신 의존성 참조 보존 (handler 재생성 없이도 최신 함수 호출)
  const moveCardRef = useRef(moveCard);
  const showToastRef = useRef(showToast);
  moveCardRef.current = moveCard;
  showToastRef.current = showToast;

  // attach: 한번 부착하면 element가 unmount되거나 변경될 때 떼고 새로 붙임
  const cleanupRef = useRef<(() => void) | null>(null);

  const attachRef = useCallback((el: HTMLElement | null) => {
    // 이전 listener 제거
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
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
        await moveCardRef.current(cardId, { row1_id, row2_id, time });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "오류";
        if (msg.includes("CELL_OCCUPIED")) showToastRef.current("이미 카드가 있는 셀입니다", "error");
        else if (msg.includes("CHART_ALREADY_EXISTS")) showToastRef.current("같은 차트가 그룹에 이미 있습니다", "error");
        else showToastRef.current(msg, "error");
      }
    };

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    cleanupRef.current = () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  return { attachRef };
}

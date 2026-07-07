import { useCallback, useRef } from "react";
import { useBoard } from "@/contexts/BoardContext";
import { useAlert } from "@/hooks/useAlert";

export function useDragDrop() {
  const { moveCard } = useBoard();
  const showAlert = useAlert();

  // 최신 의존성 참조 보존 (handler 재생성 없이도 최신 함수 호출)
  const moveCardRef = useRef(moveCard);
  const showAlertRef = useRef(showAlert);
  moveCardRef.current = moveCard;
  showAlertRef.current = showAlert;

  // attach: 한번 부착하면 element가 unmount되거나 변경될 때 떼고 새로 붙임
  const cleanupRef = useRef<(() => void) | null>(null);

  const attachRef = useCallback((el: HTMLElement | null) => {
    // 이전 listener 제거
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (!el) return;

    // 현재 드롭 타겟 하이라이트 상태
    let currentTarget: HTMLElement | null = null;
    const clearTarget = () => {
      if (currentTarget) currentTarget.classList.remove("is-drop-target");
      currentTarget = null;
    };
    const setTarget = (cell: HTMLElement | null) => {
      if (cell === currentTarget) return;
      clearTarget();
      if (cell) {
        cell.classList.add("is-drop-target");
        currentTarget = cell;
      }
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      const cell = (e.target as HTMLElement).closest?.("[data-row1][data-row2][data-time]") as HTMLElement | null;
      setTarget(cell);
    };

    const onDragLeave = (e: DragEvent) => {
      // 그리드 밖으로 벗어난 경우에만 하이라이트 제거
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !el.contains(related)) clearTarget();
    };

    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      clearTarget();
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
        if (msg.includes("CELL_OCCUPIED")) showAlertRef.current("이미 카드가 있는 셀입니다", "error");
        else if (msg.includes("CHART_ALREADY_EXISTS")) showAlertRef.current("같은 차트가 그룹에 이미 있습니다", "error");
        else showAlertRef.current(msg, "error");
      }
    };

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    cleanupRef.current = () => {
      clearTarget();
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  return { attachRef };
}

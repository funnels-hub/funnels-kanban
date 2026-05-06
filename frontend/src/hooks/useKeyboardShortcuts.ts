import { useEffect } from "react";
import { useBoard } from "@/contexts/BoardContext";
import { useSelection } from "@/contexts/SelectionContext";
import { useAlert } from "@/hooks/useAlert";
import { formatNowHHMM, isTimeEditableGroup } from "@/lib/business-rules";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

export function useKeyboardShortcuts() {
  const { snapshot, deleteCard, createCard, getCardsByChart } = useBoard();
  const { selectedCardId, selectedCell, copiedCardId, selectCard, copyCard, clearSelection } = useSelection();
  const showAlert = useAlert();

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      // Esc
      if (e.key === "Escape") {
        clearSelection();
        return;
      }

      // Delete / Backspace
      if ((e.key === "Delete" || e.key === "Backspace") && selectedCardId) {
        e.preventDefault();
        const card = snapshot?.cards.find((c) => c.id === selectedCardId);
        if (card && window.confirm(`"${card.name || card.chart || "(빈 카드)"}" 삭제?`)) {
          await deleteCard(selectedCardId);
          selectCard(null);
        }
        return;
      }

      // Ctrl+C
      if (isCtrl && e.key.toLowerCase() === "c" && selectedCardId) {
        const card = snapshot?.cards.find((c) => c.id === selectedCardId);
        if (!card) return;
        e.preventDefault();
        copyCard(selectedCardId);
        return;
      }

      // Ctrl+V
      if (isCtrl && e.key.toLowerCase() === "v" && copiedCardId && selectedCell) {
        e.preventDefault();
        const source = snapshot?.cards.find((c) => c.id === copiedCardId);
        if (!source) { showAlert("복사 원본을 찾을 수 없음", "error"); return; }

        // sibling lookup for latest data (might have changed since copy)
        let name = source.name, counselor = source.counselor, memo = source.memo, color = source.color;
        if (source.chart) {
          try {
            const sibs = await getCardsByChart(source.chart);
            if (sibs.length > 0) {
              const s = sibs[0];
              name = s.name; counselor = s.counselor; memo = s.memo; color = s.color;
            }
          } catch {}
        }

        const isTimeEditable = isTimeEditableGroup(selectedCell.row1_id);
        const book_time = isTimeEditable ? selectedCell.time : "";
        const consult_time = isTimeEditable ? formatNowHHMM() : "";

        try {
          await createCard({
            date: "" as any,  // BoardContext 자동 주입
            row1_id: selectedCell.row1_id,
            row2_id: selectedCell.row2_id,
            time: selectedCell.time,
            name, chart: source.chart, counselor, book_time, consult_time, memo, color,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "오류";
          if (msg.includes("CELL_OCCUPIED")) showAlert("이미 카드가 있는 셀입니다", "error");
          else if (msg.includes("CHART_ALREADY_EXISTS")) showAlert("이미 같은 차트가 있습니다", "error");
          else showAlert(msg, "error");
        }
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [snapshot, selectedCardId, selectedCell, copiedCardId, deleteCard, createCard, getCardsByChart, selectCard, copyCard, clearSelection, showAlert]);
}

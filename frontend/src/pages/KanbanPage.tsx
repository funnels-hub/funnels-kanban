import { useEffect, useRef } from "react";
import { TopBar } from "@/components/kanban/TopBar";
import { KanbanGrid } from "@/components/kanban/KanbanGrid";
import { CardSidePanel } from "@/components/kanban/CardSidePanel";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useDragDrop } from "@/hooks/useDragDrop";
import { useBoard } from "@/contexts/BoardContext";
import { useSelection } from "@/contexts/SelectionContext";

const AUTO_REFRESH_INTERVAL_MS = 60000;

export function KanbanPage() {
  const { status, error, refetch } = useBoard();
  const { selectedCardId } = useSelection();
  useKeyboardShortcuts();
  const { attachRef } = useDragDrop();
  const wrapRef = useRef<HTMLDivElement>(null);

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const selectedCardIdRef = useRef(selectedCardId);
  selectedCardIdRef.current = selectedCardId;
  const draggingRef = useRef(false);

  useEffect(() => {
    attachRef(wrapRef.current);
  }, [attachRef]);

  useEffect(() => {
    const onDragStart = () => {
      draggingRef.current = true;
    };
    const onDragEnd = () => {
      draggingRef.current = false;
    };
    const onVisibilityChange = () => {
      if (!document.hidden) refetchRef.current({ silent: true });
    };

    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("dragend", onDragEnd);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      if (selectedCardIdRef.current !== null) return;
      if (draggingRef.current) return;
      refetchRef.current({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("dragend", onDragEnd);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <TopBar />
      <div ref={wrapRef} className="flex-1 overflow-hidden flex flex-col">
        {status === "loading" && <div className="p-4 text-muted-foreground text-sm">로딩 중…</div>}
        {status === "error" && <div className="p-4 text-destructive text-sm">에러: {error}</div>}
        <KanbanGrid />
      </div>
      <CardSidePanel />
    </div>
  );
}

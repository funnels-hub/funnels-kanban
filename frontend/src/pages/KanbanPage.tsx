import { useEffect, useRef } from "react";
import { TopBar } from "@/components/kanban/TopBar";
import { KanbanGrid } from "@/components/kanban/KanbanGrid";
import { CardSidePanel } from "@/components/kanban/CardSidePanel";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useDragDrop } from "@/hooks/useDragDrop";
import { useBoard } from "@/contexts/BoardContext";

export function KanbanPage() {
  const { status, error } = useBoard();
  useKeyboardShortcuts();
  const { attachRef } = useDragDrop();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    attachRef(wrapRef.current);
  }, [attachRef]);

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

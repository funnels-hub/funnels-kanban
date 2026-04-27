import { useState, useRef, useEffect } from "react";
import type { ColumnRow1 } from "@/types/columns";
import { useBoard } from "@/contexts/BoardContext";
import { Input } from "@/components/ui/Input";
import { MoreHorizontal } from "lucide-react";

export function HeaderRow1({
  row1,
  span,
  groupIndex,
}: {
  row1: ColumnRow1;
  span: number;
  groupIndex: number;
}) {
  const { renameRow1, deleteRow1 } = useBoard();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row1.label);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const handleSave = async () => {
    if (draft.trim() && draft !== row1.label) {
      await renameRow1(row1.id, { label: draft.trim() });
    }
    setEditing(false);
  };
  const handleDelete = async () => {
    setMenuOpen(false);
    if (window.confirm(`"${row1.label}" 그룹과 모든 카드를 삭제할까요?`)) {
      await deleteRow1(row1.id);
    }
  };

  return (
    <div
      className={`hdr hdr-row1 grp-${groupIndex % 8}`}
      style={{ gridColumn: `span ${span}` }}
    >
      <div className="flex items-center gap-1 px-1.5 w-full">
        {editing ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setDraft(row1.label); setEditing(false); }
            }}
            autoFocus
            className="h-5 text-xs px-1"
          />
        ) : (
          <span
            className="flex-1 cursor-pointer truncate"
            onDoubleClick={() => { if (!row1.built_in) { setDraft(row1.label); setEditing(true); } }}
          >
            {row1.label}
          </span>
        )}

        {!row1.built_in && (
          <div ref={menuRef} className="relative">
            <button type="button" className="hdr-edit" onClick={() => setMenuOpen((v) => !v)}>
              <MoreHorizontal className="w-3 h-3" />
            </button>
            {menuOpen && (
              <div className="ctx-menu" style={{ position: "absolute", right: 0, top: "100%", zIndex: 50 }}>
                <button type="button" className="ctx-menu-item" onClick={() => { setMenuOpen(false); setDraft(row1.label); setEditing(true); }}>이름 변경</button>
                <button type="button" className="ctx-menu-item destructive" onClick={handleDelete}>삭제</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import type { ColumnRow2 } from "@/types/columns";
import { useBoard } from "@/contexts/BoardContext";
import { Input } from "@/components/ui/Input";
import { X } from "lucide-react";

export function HeaderRow2({
  row2,
  groupIndex,
  isFirstLeaf,
}: {
  row2: ColumnRow2;
  groupIndex: number;
  isFirstLeaf: boolean;
}) {
  const { renameRow2, deleteRow2 } = useBoard();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row2.label);

  const handleSave = async () => {
    if (draft.trim() && draft !== row2.label) {
      await renameRow2(row2.id, { label: draft.trim() });
    }
    setEditing(false);
  };
  const handleDelete = async () => {
    if (window.confirm(`"${row2.label}" 컬럼과 카드를 삭제할까요?`)) {
      try {
        await deleteRow2(row2.id);
      } catch (e) {
        if (e instanceof Error && e.message.includes("LAST_LEAF")) {
          window.alert("마지막 leaf는 삭제할 수 없습니다.");
        } else {
          throw e;
        }
      }
    }
  };

  return (
    <div className={`hdr hdr-row2 grp-${groupIndex % 8} ${isFirstLeaf ? "col-sep-l" : ""}`}>
      <div className="flex items-center gap-0.5 px-1 w-full group">
        {editing ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setDraft(row2.label); setEditing(false); }
            }}
            autoFocus
            className="h-5 text-xs px-1"
          />
        ) : (
          <span
            className="flex-1 cursor-pointer truncate"
            onDoubleClick={() => { setDraft(row2.label); setEditing(true); }}
          >
            {row2.label}
          </span>
        )}
        <button
          type="button"
          className="hdr-del opacity-0 group-hover:opacity-100"
          onClick={handleDelete}
          title="삭제"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

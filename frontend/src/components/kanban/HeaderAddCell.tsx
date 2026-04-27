import { Plus } from "lucide-react";
import { useBoard } from "@/contexts/BoardContext";

interface Props {
  type: "row1" | "row2";
  row1Id?: string;  // type='row2'일 때 필수
}

export function HeaderAddCell({ type, row1Id }: Props) {
  const { addRow1, addRow2 } = useBoard();

  const handleClick = async () => {
    if (type === "row1") {
      const label = window.prompt("새 그룹 이름");
      if (label && label.trim()) await addRow1({ label: label.trim() });
    } else {
      if (!row1Id) return;
      const label = window.prompt("새 컬럼 이름");
      if (label && label.trim()) await addRow2({ row1_id: row1Id, label: label.trim() });
    }
  };

  return (
    <div className={`hdr hdr-add ${type === "row1" ? "hdr-row1" : "hdr-row2"}`}>
      <button type="button" onClick={handleClick} className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-foreground">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

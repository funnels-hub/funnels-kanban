import { Link } from "react-router-dom";
import { Stethoscope, LayoutGrid } from "lucide-react";
import { DateNav } from "./DateNav";
import { ImplantStats } from "./ImplantStats";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import { Button } from "@/components/ui/Button";
import { useBoard } from "@/contexts/BoardContext";

export function TopBar() {
  const { addRow1 } = useBoard();

  const handleAddRow1 = async () => {
    const label = window.prompt("새 그룹 이름");
    if (label && label.trim()) await addRow1({ label: label.trim() });
  };

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-background">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-emerald-400 flex items-center justify-center text-white">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold flex items-center gap-1.5">
            <span>치과 상담</span>
            <span className="text-xs text-muted-foreground font-normal">
              v1c-b · 2계층 + 그룹 규칙
            </span>
          </div>
          <div className="text-xs text-muted-foreground">예약 대시보드</div>
        </div>
      </div>

      <DateNav />

      <div className="flex items-center gap-2 shrink-0">
        <ImplantStats />
        <Button onClick={handleAddRow1} variant="default" className="text-xs">
          + 그룹 추가
        </Button>
        <Link
          to="/templates"
          className="dlg-btn text-xs flex items-center gap-1"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          템플릿
        </Link>
        <DarkModeToggle />
      </div>
    </header>
  );
}

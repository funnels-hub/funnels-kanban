import { Link } from "react-router-dom";
import { Stethoscope, LayoutGrid, Building2, LogOut } from "lucide-react";
import { DateNav } from "./DateNav";
import { ImplantStats } from "./ImplantStats";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import { Button } from "@/components/ui/Button";
import { useBoard } from "@/contexts/BoardContext";
import { useAuth } from "@/contexts/AuthContext";

export function TopBar() {
  const { addRow1 } = useBoard();
  const { hospital, isAdmin, logout } = useAuth();

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
        <div className="text-base font-semibold">치과상담 예약 대시보드</div>
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
        {isAdmin && (
          <Link
            to="/admin/hospitals"
            className="dlg-btn flex items-center gap-1 text-xs"
          >
            <Building2 className="w-3.5 h-3.5" />
            병원 관리
          </Link>
        )}
        <DarkModeToggle />
        {hospital && (
          <span
            className="text-xs text-muted-foreground"
            title={hospital.email}
          >
            {hospital.name}
          </span>
        )}
        <button
          type="button"
          className="hdr-icon-btn"
          onClick={logout}
          title="로그아웃"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

import { useEffect } from "react";
import { useHospitals } from "@/contexts/HospitalContext";
import { useDialog } from "@/contexts/DialogContext";
import { Button } from "@/components/ui/Button";
import { HospitalRow } from "./HospitalRow";
import { HospitalCreateDialog } from "./HospitalCreateDialog";
import { Plus } from "lucide-react";

export function HospitalListView() {
  const { hospitals, status, fetchHospitals } = useHospitals();
  const { openDialog } = useDialog();

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">병원 {hospitals.length}개</div>
        <Button variant="primary" onClick={() => openDialog(<HospitalCreateDialog onSuccess={fetchHospitals} />)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> 새 병원
        </Button>
      </div>
      {status === "loading" && <div className="text-sm text-muted-foreground">로딩 중…</div>}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-3 py-2">이름</th>
              <th className="text-left px-3 py-2">이메일</th>
              <th className="text-left px-3 py-2">권한</th>
              <th className="text-left px-3 py-2">상태</th>
              <th className="text-right px-3 py-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map((h) => <HospitalRow key={h.id} hospital={h} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

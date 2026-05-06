import type { Hospital } from "@/types/hospitals";
import { useHospitals } from "@/contexts/HospitalContext";
import { useDialog } from "@/contexts/DialogContext";
import { useConfirm } from "@/hooks/useConfirm";
import { HospitalEditDialog } from "./HospitalEditDialog";

export function HospitalRow({ hospital }: { hospital: Hospital }) {
  const { updateHospital, deleteHospital, fetchHospitals } = useHospitals();
  const { openDialog } = useDialog();
  const confirm = useConfirm();

  const handleToggleActive = async () => {
    if (hospital.is_admin) return;
    if (!hospital.is_active) {
      // 재활성화
      const ok = await confirm({ message: `"${hospital.name}"을(를) 활성화할까요?`, danger: false });
      if (ok) {
        await updateHospital(hospital.id, { is_active: true });
      }
    } else {
      // 비활성화 (soft delete)
      const ok = await confirm({ message: `"${hospital.name}"을(를) 비활성화할까요?`, danger: false });
      if (ok) {
        await deleteHospital(hospital.id);
      }
    }
  };

  return (
    <tr className="border-t">
      <td className="px-3 py-2">{hospital.name}</td>
      <td className="px-3 py-2 text-muted-foreground">{hospital.email}</td>
      <td className="px-3 py-2">
        {hospital.is_admin ? (
          <span className="inline-block bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">관리자</span>
        ) : (
          <span className="text-muted-foreground text-xs">일반</span>
        )}
      </td>
      <td className="px-3 py-2">
        {hospital.is_active ? (
          <span className="text-emerald-600 text-xs">활성</span>
        ) : (
          <span className="text-muted-foreground text-xs">비활성</span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          className="dlg-btn text-xs mr-1"
          onClick={() => openDialog(<HospitalEditDialog hospital={hospital} onSuccess={fetchHospitals} />)}
        >
          편집
        </button>
        <button
          type="button"
          className="dlg-btn text-xs"
          onClick={handleToggleActive}
          disabled={hospital.is_admin}
          title={hospital.is_admin ? "관리자 계정은 변경 불가" : ""}
        >
          {hospital.is_active ? "비활성화" : "활성화"}
        </button>
      </td>
    </tr>
  );
}

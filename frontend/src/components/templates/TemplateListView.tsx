import { useTemplates } from "@/contexts/TemplateContext";
import { useBoard } from "@/contexts/BoardContext";
import { useCurrentDate } from "@/contexts/DateContext";
import { useAlert } from "@/hooks/useAlert";
import { useConfirm } from "@/hooks/useConfirm";
import { TemplateCard } from "./TemplateCard";
import { Plus } from "lucide-react";
import type { Template } from "@/types/templates";

export function TemplateListView({ onSelectEdit }: { onSelectEdit: (tpl: Template) => void }) {
  const { templates, status, createTemplate, deleteTemplate, updateTemplate } = useTemplates();
  const { applyTemplate } = useBoard();
  const { date } = useCurrentDate();
  const showAlert = useAlert();
  const confirm = useConfirm();

  const handleNew = async () => {
    const name = window.prompt("새 템플릿 이름");
    if (!name?.trim()) return;
    await createTemplate({ name: name.trim(), source_date: date });
    showAlert("템플릿 생성됨", "success");
  };

  const handleApply = async (tpl: Template) => {
    const ok = await confirm({ message: `"${tpl.name}"을(를) ${date} 보드에 적용할까요? 현재 카드와 컬럼이 모두 삭제됩니다.`, danger: true });
    if (!ok) return;
    try {
      await applyTemplate(tpl.id);
      showAlert("템플릿 적용 완료", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "오류";
      showAlert(msg, "error");
    }
  };

  const handleDelete = async (tpl: Template) => {
    const ok = await confirm({ message: `"${tpl.name}" 삭제?`, danger: true });
    if (!ok) return;
    try {
      await deleteTemplate(tpl.id);
      showAlert("삭제됨", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "오류";
      if (msg.includes("CANNOT_DELETE_DEFAULT")) showAlert("기본 템플릿은 삭제할 수 없습니다", "error");
      else showAlert(msg, "error");
    }
  };

  const handleSetDefault = async (tpl: Template) => {
    if (tpl.is_default) return;
    const ok = await confirm({ message: `"${tpl.name}"을(를) 기본 템플릿으로 설정할까요?`, danger: false });
    if (!ok) return;
    try {
      await updateTemplate(tpl.id, { is_default: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "오류";
      showAlert(msg, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">템플릿 {templates.length}개</div>
        <button type="button" className="dlg-btn dlg-btn-primary flex items-center gap-1" onClick={handleNew}>
          <Plus className="w-3.5 h-3.5" /> 새 템플릿
        </button>
      </div>

      {status === "loading" && <div className="text-sm text-muted-foreground">로딩 중…</div>}

      <div className="space-y-3">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onApply={() => handleApply(t)}
            onEdit={() => onSelectEdit(t)}
            onDelete={() => handleDelete(t)}
            onSetDefault={() => handleSetDefault(t)}
          />
        ))}
      </div>
    </div>
  );
}

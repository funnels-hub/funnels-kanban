import { useTemplates } from "@/contexts/TemplateContext";
import { useBoard } from "@/contexts/BoardContext";
import { useCurrentDate } from "@/contexts/DateContext";
import { useToast } from "@/contexts/ToastContext";
import { TemplateCard } from "./TemplateCard";
import { Plus } from "lucide-react";
import type { Template } from "@/types/templates";

export function TemplateListView({ onSelectEdit }: { onSelectEdit: (tpl: Template) => void }) {
  const { templates, status, createTemplate, deleteTemplate } = useTemplates();
  const { applyTemplate } = useBoard();
  const { date } = useCurrentDate();
  const { showToast } = useToast();

  const handleNew = async () => {
    const name = window.prompt("새 템플릿 이름");
    if (!name?.trim()) return;
    await createTemplate({ name: name.trim(), source_date: date });
    showToast("템플릿 생성됨", "success");
  };

  const handleApply = async (tpl: Template) => {
    if (!window.confirm(`"${tpl.name}"을(를) ${date} 보드에 적용할까요? 현재 카드와 컬럼이 모두 삭제됩니다.`)) return;
    try {
      await applyTemplate(tpl.id);
      showToast("템플릿 적용 완료", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "오류";
      showToast(msg, "error");
    }
  };

  const handleDelete = async (tpl: Template) => {
    if (!window.confirm(`"${tpl.name}" 삭제?`)) return;
    try {
      await deleteTemplate(tpl.id);
      showToast("삭제됨", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "오류";
      if (msg.includes("CANNOT_DELETE_DEFAULT")) showToast("기본 템플릿은 삭제할 수 없습니다", "error");
      else showToast(msg, "error");
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
          />
        ))}
      </div>
    </div>
  );
}

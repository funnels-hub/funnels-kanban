import { useTemplates } from "@/contexts/TemplateContext";
import type { Template } from "@/types/templates";
import { Check, Pencil, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function TemplateCard({
  template,
  onApply,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  template: Template;
  onApply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const { updateTemplate } = useTemplates();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(template.name);

  useEffect(() => {
    setDraft(template.name);
  }, [template.name]);

  // group leaves by row1_id
  const leavesByR1 = new Map<string, string[]>();
  for (const r2 of template.row2) {
    if (!leavesByR1.has(r2.row1_id)) leavesByR1.set(r2.row1_id, []);
    leavesByR1.get(r2.row1_id)!.push(r2.label);
  }

  const created = new Date(template.created_at);
  const createdStr = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")} ${String(created.getHours()).padStart(2, "0")}:${String(created.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="tpl-card">
      <div className="tpl-card-head">
        <div className="tpl-card-title">
          {editing ? (
            <input
              className="tpl-card-title-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={async () => {
                if (draft.trim() && draft !== template.name) {
                  await updateTemplate(template.id, { name: draft.trim() });
                } else {
                  setDraft(template.name);
                }
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setDraft(template.name);
                  setEditing(false);
                }
              }}
              autoFocus
            />
          ) : (
            <>
              <span
                onDoubleClick={() => setEditing(true)}
                style={{ cursor: "text" }}
                title="더블클릭하여 이름 변경"
              >
                {template.name}
              </span>
              {template.is_default && <span className="tpl-card-default-badge">· 기본</span>}
            </>
          )}
        </div>
        <div className="tpl-actions">
          <button type="button" className="tpl-btn tpl-btn-primary" onClick={onApply}>
            <Check className="w-3.5 h-3.5" /> 적용
          </button>
          <button type="button" className="tpl-btn" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" /> 편집
          </button>
          <button
            type="button"
            className="tpl-btn"
            onClick={onSetDefault}
            disabled={template.is_default}
            title={template.is_default ? "이미 기본 템플릿" : "기본 템플릿으로 설정"}
          >
            <Star
              className="w-3.5 h-3.5"
              fill={template.is_default ? "currentColor" : "none"}
            />{" "}
            {template.is_default ? "기본" : "기본 설정"}
          </button>
          <button
            type="button"
            className="tpl-btn tpl-btn-destructive"
            onClick={onDelete}
            disabled={template.is_default}
          >
            <Trash2 className="w-3.5 h-3.5" /> 삭제
          </button>
        </div>
      </div>
      <div className="tpl-meta">
        생성: {createdStr} · 대분류 {template.row1.length}개 / 컬럼 {template.row2.length}개
      </div>
      <div className="tpl-preview">
        {template.row1.map((r1) => {
          const leaves = leavesByR1.get(r1.id) ?? [];
          return (
            <div key={r1.id} className="tpl-preview-line">
              <span className="tpl-preview-group">{r1.label}:</span>
              {" "}
              {leaves.join(", ")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from "react";
import type { Template, TemplateColumnItem, TemplateLeafItem } from "@/types/templates";
import { useTemplates } from "@/contexts/TemplateContext";
import { useToast } from "@/contexts/ToastContext";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Plus, X } from "lucide-react";

const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`;

export function TemplateEditView({
  template,
  onBack,
}: {
  template: Template;
  onBack: () => void;
}) {
  const { updateTemplate } = useTemplates();
  const { showToast } = useToast();
  const [row1, setRow1] = useState<TemplateColumnItem[]>(template.row1);
  const [row2, setRow2] = useState<TemplateLeafItem[]>(template.row2);
  const [name, setName] = useState(template.name);
  const [editingName, setEditingName] = useState(false);

  const persist = async (next1?: TemplateColumnItem[], next2?: TemplateLeafItem[], nextName?: string) => {
    const r1 = next1 ?? row1;
    const r2 = next2 ?? row2;
    const n = nextName ?? name;
    if (next1) setRow1(next1);
    if (next2) setRow2(next2);
    if (nextName) setName(nextName);
    try {
      await updateTemplate(template.id, { name: n, row1: r1, row2: r2 });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "오류", "error");
    }
  };

  const renameTemplate = async () => {
    if (name.trim() && name !== template.name) {
      await persist(undefined, undefined, name.trim());
    }
    setEditingName(false);
  };

  const addRow1 = async () => {
    const label = window.prompt("새 대분류 이름");
    if (!label?.trim()) return;
    const newR1 = [...row1, { id: newId("r1"), label: label.trim() }];
    const firstLeafId = newId("r2");
    const newR2 = [...row2, { id: firstLeafId, row1_id: newR1[newR1.length - 1].id, label: "컬럼1" }];
    await persist(newR1, newR2);
  };

  const renameRow1 = async (id: string, label: string) => {
    await persist(row1.map((r) => r.id === id ? { ...r, label } : r));
  };

  const deleteRow1 = async (id: string) => {
    if (!window.confirm("이 대분류와 모든 컬럼을 삭제할까요?")) return;
    await persist(row1.filter((r) => r.id !== id), row2.filter((r) => r.row1_id !== id));
  };

  const addLeaf = async (row1_id: string) => {
    const label = window.prompt("새 컬럼 이름");
    if (!label?.trim()) return;
    await persist(undefined, [...row2, { id: newId("r2"), row1_id, label: label.trim() }]);
  };

  const renameLeaf = async (id: string, label: string) => {
    await persist(undefined, row2.map((r) => r.id === id ? { ...r, label } : r));
  };

  const deleteLeaf = async (id: string) => {
    await persist(undefined, row2.filter((r) => r.id !== id));
  };

  return (
    <div>
      <div className="edit-header">
        <button type="button" className="edit-back" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> 돌아가기
        </button>
        <div className="edit-title">
          {editingName ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={renameTemplate}
              onKeyDown={(e) => { if (e.key === "Enter") renameTemplate(); if (e.key === "Escape") { setName(template.name); setEditingName(false); } }}
              autoFocus
              className="edit-title-input"
            />
          ) : (
            <span onClick={() => setEditingName(true)} className="cursor-pointer">{name}</span>
          )}
        </div>
        <div className="edit-actions" />
      </div>
      <div className="edit-meta">대분류 {row1.length}개 / 컬럼 {row2.length}개</div>

      <div className="space-y-3">
        {row1.map((r1) => {
          const leaves = row2.filter((r) => r.row1_id === r1.id);
          return (
            <div key={r1.id} className="r1-section">
              <div className="r1-head">
                <div className="r1-head-left flex items-center gap-2 flex-1">
                  <Input
                    defaultValue={r1.label}
                    onBlur={(e) => { if (e.target.value.trim() !== r1.label) renameRow1(r1.id, e.target.value.trim()); }}
                    className="r1-title-input"
                  />
                </div>
                <button type="button" className="dlg-btn dlg-btn-destructive text-xs" onClick={() => deleteRow1(r1.id)}>삭제</button>
              </div>
              <div className="r1-leaves flex items-center gap-1.5 flex-wrap">
                {leaves.map((l) => (
                  <div key={l.id} className="leaf-tag">
                    <Input
                      defaultValue={l.label}
                      onBlur={(e) => { if (e.target.value.trim() !== l.label) renameLeaf(l.id, e.target.value.trim()); }}
                      className="leaf-label-input"
                    />
                    <button type="button" className="leaf-remove" onClick={() => deleteLeaf(l.id)} title="삭제">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button type="button" className="leaf-add" onClick={() => addLeaf(r1.id)}>
                  <Plus className="w-3 h-3" /> leaf
                </button>
              </div>
            </div>
          );
        })}
        <button type="button" className="add-r1-btn" onClick={addRow1}>
          <Plus className="w-4 h-4" /> 대분류 추가
        </button>
      </div>
    </div>
  );
}

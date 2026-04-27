import { useState, useRef, useEffect } from "react";
import type {
  Template,
  TemplateColumnItem,
  TemplateLeafItem,
} from "@/types/templates";
import { useTemplates } from "@/contexts/TemplateContext";
import { useBoard } from "@/contexts/BoardContext";
import { useCurrentDate } from "@/contexts/DateContext";
import { useToast } from "@/contexts/ToastContext";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  X,
  MoreHorizontal,
  Copy,
  Check,
  Trash2,
} from "lucide-react";

const newId = (prefix: string) =>
  `${prefix}_${crypto.randomUUID().slice(0, 8)}`;

export function TemplateEditView({
  template,
  onBack,
}: {
  template: Template;
  onBack: () => void;
}) {
  const { updateTemplate, duplicateTemplate, deleteTemplate } = useTemplates();
  const { applyTemplate } = useBoard();
  const { date } = useCurrentDate();
  const { showToast } = useToast();

  const [row1, setRow1] = useState<TemplateColumnItem[]>(template.row1);
  const [row2, setRow2] = useState<TemplateLeafItem[]>(template.row2);
  const [name, setName] = useState(template.name);
  const [editingTitle, setEditingTitle] = useState(false);

  // 외부 변경(refetch 후) sync
  useEffect(() => {
    setRow1(template.row1);
    setRow2(template.row2);
    setName(template.name);
  }, [template.id, template.updated_at, template.row1, template.row2, template.name]);

  const persist = async (
    next1?: TemplateColumnItem[],
    next2?: TemplateLeafItem[],
    nextName?: string,
  ) => {
    const r1 = next1 ?? row1;
    const r2 = next2 ?? row2;
    const n = nextName ?? name;
    if (next1) setRow1(next1);
    if (next2) setRow2(next2);
    if (nextName !== undefined) setName(nextName);
    try {
      await updateTemplate(template.id, { name: n, row1: r1, row2: r2 });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "저장 실패", "error");
    }
  };

  const handleTitleCommit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(template.name);
      setEditingTitle(false);
      return;
    }
    if (trimmed !== template.name) {
      await persist(undefined, undefined, trimmed);
    }
    setEditingTitle(false);
  };

  const handleDuplicate = async () => {
    try {
      const dup = await duplicateTemplate(template.id);
      showToast(`"${dup.name}" 복제됨`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "복제 실패", "error");
    }
  };

  const handleApply = async () => {
    if (
      !window.confirm(
        `"${name}" 을(를) ${date}에 적용할까요? 현재 카드와 컬럼이 모두 삭제됩니다.`,
      )
    )
      return;
    try {
      await applyTemplate(template.id);
      showToast("템플릿 적용 완료", "success");
      onBack();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "적용 실패", "error");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${name}" 삭제?`)) return;
    try {
      await deleteTemplate(template.id);
      onBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "오류";
      showToast(
        msg.includes("CANNOT_DELETE_DEFAULT")
          ? "기본 템플릿은 삭제할 수 없습니다"
          : msg,
        "error",
      );
    }
  };

  const handleAddRow1 = async () => {
    const label = window.prompt("새 대분류 이름");
    if (!label?.trim()) return;
    const r1Id = newId("r1");
    const nextR1 = [...row1, { id: r1Id, label: label.trim() }];
    const nextR2 = [
      ...row2,
      { id: newId("r2"), row1_id: r1Id, label: "컬럼1" },
    ];
    await persist(nextR1, nextR2);
  };

  return (
    <div>
      <div className="edit-header">
        <button type="button" className="edit-back" onClick={onBack}>
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>목록으로</span>
        </button>
        <div className="edit-title">
          {editingTitle ? (
            <input
              className="edit-title-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleTitleCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
                if (e.key === "Escape") {
                  setName(template.name);
                  setEditingTitle(false);
                }
              }}
              autoFocus
            />
          ) : (
            <>
              <span
                onClick={() => setEditingTitle(true)}
                className="cursor-pointer"
              >
                {name}
              </span>
              {template.is_default && (
                <span className="text-muted-foreground"> · 기본</span>
              )}
            </>
          )}
        </div>
        <div className="edit-actions">
          <button type="button" className="tpl-btn" onClick={handleDuplicate}>
            <Copy className="w-3.5 h-3.5" />
            <span>복제</span>
          </button>
          <button
            type="button"
            className="tpl-btn tpl-btn-primary"
            onClick={handleApply}
          >
            <Check className="w-3.5 h-3.5" />
            <span>적용</span>
          </button>
          <button
            type="button"
            className="tpl-btn tpl-btn-destructive"
            disabled={template.is_default}
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>삭제</span>
          </button>
        </div>
      </div>
      <div className="edit-meta">
        대분류 {row1.length}개 / 컬럼 {row2.length}개
      </div>

      {row1.map((r1) => {
        const leaves = row2.filter((r) => r.row1_id === r1.id);
        return (
          <Row1Section
            key={r1.id}
            r1={r1}
            leaves={leaves}
            onRenameR1={async (label) =>
              persist(
                row1.map((x) => (x.id === r1.id ? { ...x, label } : x)),
              )
            }
            onDeleteR1={async () => {
              if (!window.confirm(`"${r1.label}" 삭제?`)) return;
              await persist(
                row1.filter((x) => x.id !== r1.id),
                row2.filter((x) => x.row1_id !== r1.id),
              );
            }}
            onAddLeaf={async () => {
              const label = window.prompt("새 컬럼 이름");
              if (!label?.trim()) return;
              await persist(undefined, [
                ...row2,
                { id: newId("r2"), row1_id: r1.id, label: label.trim() },
              ]);
            }}
            onRenameLeaf={async (id, label) =>
              persist(
                undefined,
                row2.map((x) => (x.id === id ? { ...x, label } : x)),
              )
            }
            onDeleteLeaf={async (id) =>
              persist(
                undefined,
                row2.filter((x) => x.id !== id),
              )
            }
          />
        );
      })}

      <button type="button" className="add-r1-btn" onClick={handleAddRow1}>
        <Plus className="w-3.5 h-3.5" />
        <span>대분류 추가</span>
      </button>
    </div>
  );
}

function Row1Section({
  r1,
  leaves,
  onRenameR1,
  onDeleteR1,
  onAddLeaf,
  onRenameLeaf,
  onDeleteLeaf,
}: {
  r1: TemplateColumnItem;
  leaves: TemplateLeafItem[];
  onRenameR1: (label: string) => void;
  onDeleteR1: () => void;
  onAddLeaf: () => void;
  onRenameLeaf: (id: string, label: string) => void;
  onDeleteLeaf: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(r1.label);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== r1.label) {
      onRenameR1(trimmed);
    } else {
      setDraft(r1.label);
    }
    setEditing(false);
  };

  return (
    <div className="r1-section">
      <div className="r1-head">
        <div className="r1-head-left">
          <span className="r1-drag-handle" title="드래그로 순서 변경">
            <GripVertical className="w-3 h-3" />
          </span>
          {editing ? (
            <input
              className="r1-title-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
                if (e.key === "Escape") {
                  setDraft(r1.label);
                  setEditing(false);
                }
              }}
              autoFocus
            />
          ) : (
            <span
              className="r1-title"
              title="더블클릭으로 이름 변경"
              onDoubleClick={() => {
                setDraft(r1.label);
                setEditing(true);
              }}
            >
              {r1.label}
            </span>
          )}
        </div>
        <div className="r1-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="r1-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            title="메뉴"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
          {menuOpen && (
            <div className="r1-menu open">
              <button
                type="button"
                className="r1-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  setDraft(r1.label);
                  setEditing(true);
                }}
              >
                <span>이름 변경</span>
              </button>
              <button
                type="button"
                className="r1-menu-item destructive"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteR1();
                }}
              >
                <span>삭제</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="r1-leaves">
        {leaves.map((l) => (
          <LeafTag
            key={l.id}
            leaf={l}
            onRename={(label) => onRenameLeaf(l.id, label)}
            onDelete={() => onDeleteLeaf(l.id)}
          />
        ))}
        <button
          type="button"
          className="leaf-add"
          onClick={onAddLeaf}
          title="컬럼 추가"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function LeafTag({
  leaf,
  onRename,
  onDelete,
}: {
  leaf: TemplateLeafItem;
  onRename: (label: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(leaf.label);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== leaf.label) {
      onRename(trimmed);
    } else {
      setDraft(leaf.label);
    }
    setEditing(false);
  };

  return (
    <span className="leaf-tag" title="더블클릭으로 이름 변경">
      {editing ? (
        <input
          className="leaf-label-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === "Escape") {
              setDraft(leaf.label);
              setEditing(false);
            }
          }}
          autoFocus
        />
      ) : (
        <>
          <span
            className="leaf-label"
            onDoubleClick={() => {
              setDraft(leaf.label);
              setEditing(true);
            }}
          >
            {leaf.label}
          </span>
          <button
            type="button"
            className="leaf-remove"
            onClick={onDelete}
            title="삭제"
          >
            <X className="w-3 h-3" />
          </button>
        </>
      )}
    </span>
  );
}

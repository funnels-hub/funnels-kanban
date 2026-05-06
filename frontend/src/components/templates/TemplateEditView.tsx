import { useState, useRef, useEffect } from "react";
import type {
  Template,
  TemplateColumnItem,
  TemplateLeafItem,
} from "@/types/templates";
import { useTemplates } from "@/contexts/TemplateContext";
import { useDialog } from "@/contexts/DialogContext";
import { useAlert } from "@/hooks/useAlert";
import { useConfirm } from "@/hooks/useConfirm";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  X,
  MoreHorizontal,
  Copy,
  Trash2,
  Save,
  Undo2,
  Loader2,
} from "lucide-react";

const PROTECTED_ROW1_IDS = ["r1_구환", "r1_신환"];

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
  const { openDialog, closeDialog } = useDialog();
  const showAlert = useAlert();
  const confirm = useConfirm();

  const [row1, setRow1] = useState<TemplateColumnItem[]>(template.row1);
  const [row2, setRow2] = useState<TemplateLeafItem[]>(template.row2);
  const [name, setName] = useState(template.name);
  const [editingTitle, setEditingTitle] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "duplicate" | "delete">(null);

  useEffect(() => {
    setRow1(template.row1);
    setRow2(template.row2);
    setName(template.name);
  }, [template.id, template.updated_at, template.row1, template.row2, template.name]);

  const dirty =
    JSON.stringify({ name, row1, row2 }) !==
    JSON.stringify({ name: template.name, row1: template.row1, row2: template.row2 });

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const aData = active.data.current;
    const oData = over.data.current;
    if (aData?.kind === "r1" && oData?.kind === "r1") {
      const oldIdx = row1.findIndex((r) => r.id === active.id);
      const newIdx = row1.findIndex((r) => r.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return;
      setRow1(arrayMove(row1, oldIdx, newIdx));
      return;
    }
    if (
      aData?.kind === "leaf" &&
      oData?.kind === "leaf" &&
      aData.row1_id === oData.row1_id
    ) {
      const oldIdx = row2.findIndex((l) => l.id === active.id);
      const newIdx = row2.findIndex((l) => l.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return;
      setRow2(arrayMove(row2, oldIdx, newIdx));
      return;
    }
  };

  const handleTitleCommit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(template.name);
      setEditingTitle(false);
      return;
    }
    setName(trimmed);
    setEditingTitle(false);
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy("save");
    try {
      await updateTemplate(template.id, { name, row1, row2 });
      showAlert("저장 완료", "success");
    } catch (e) {
      showAlert(e instanceof Error ? e.message : "저장 실패", "error");
    } finally {
      setBusy(null);
    }
  };

  const handleRevert = () => {
    setRow1(template.row1);
    setRow2(template.row2);
    setName(template.name);
  };

  const handleDuplicate = async () => {
    if (busy) return;
    if (dirty) {
      showAlert("저장되지 않은 변경사항은 복제본에 반영되지 않습니다.", "info");
    }
    setBusy("duplicate");
    try {
      const dup = await duplicateTemplate(template.id);
      showAlert(`"${dup.name}" 복제됨`, "success");
    } catch (e) {
      showAlert(e instanceof Error ? e.message : "복제 실패", "error");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    const ok = await confirm({ message: `"${name}" 삭제?`, danger: true });
    if (!ok) return;
    setBusy("delete");
    try {
      await deleteTemplate(template.id);
      onBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "오류";
      showAlert(
        msg.includes("CANNOT_DELETE_DEFAULT")
          ? "기본 템플릿은 삭제할 수 없습니다"
          : msg,
        "error",
      );
    } finally {
      setBusy(null);
    }
  };

  const handleAddRow1 = () => {
    const label = window.prompt("새 대분류 이름");
    if (!label?.trim()) return;
    const r1Id = newId("r1");
    setRow1([...row1, { id: r1Id, label: label.trim() }]);
    setRow2([
      ...row2,
      { id: newId("r2"), row1_id: r1Id, label: "컬럼1" },
    ]);
  };

  const handleBack = () => {
    if (!dirty) {
      onBack();
      return;
    }
    openDialog(
      <ConfirmLeaveDialog
        onConfirm={() => {
          closeDialog();
          onBack();
        }}
        onCancel={closeDialog}
      />,
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div>
        <div className="edit-header">
          <button type="button" className="edit-back" onClick={handleBack}>
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
            <button
              type="button"
              className="tpl-btn tpl-btn-primary"
              onClick={handleSave}
              disabled={!dirty || busy !== null}
            >
              {busy === "save" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>저장</span>
            </button>
            <button
              type="button"
              className="tpl-btn"
              onClick={handleRevert}
              disabled={!dirty || busy !== null}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>되돌리기</span>
            </button>
            <button
              type="button"
              className="tpl-btn"
              onClick={handleDuplicate}
              disabled={busy !== null}
            >
              {busy === "duplicate" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>복제</span>
            </button>
            <button
              type="button"
              className="tpl-btn tpl-btn-destructive"
              disabled={template.is_default || busy !== null}
              onClick={handleDelete}
            >
              {busy === "delete" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>삭제</span>
            </button>
          </div>
        </div>
        <div className="edit-meta">
          대분류 {row1.length}개 / 컬럼 {row2.length}개
        </div>

        <SortableContext
          items={row1.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {row1.map((r1) => {
            const leaves = row2.filter((r) => r.row1_id === r1.id);
            return (
              <Row1Section
                key={r1.id}
                r1={r1}
                leaves={leaves}
                protected={PROTECTED_ROW1_IDS.includes(r1.id)}
                onRenameR1={(label) =>
                  setRow1(
                    row1.map((x) => (x.id === r1.id ? { ...x, label } : x)),
                  )
                }
                onDeleteR1={async () => {
                  const ok = await confirm({ message: `"${r1.label}" 삭제?`, danger: true });
                  if (!ok) return;
                  setRow1(row1.filter((x) => x.id !== r1.id));
                  setRow2(row2.filter((x) => x.row1_id !== r1.id));
                }}
                onAddLeaf={() => {
                  const label = window.prompt("새 컬럼 이름");
                  if (!label?.trim()) return;
                  setRow2([
                    ...row2,
                    { id: newId("r2"), row1_id: r1.id, label: label.trim() },
                  ]);
                }}
                onRenameLeaf={(id, label) =>
                  setRow2(
                    row2.map((x) => (x.id === id ? { ...x, label } : x)),
                  )
                }
                onDeleteLeaf={(id) =>
                  setRow2(row2.filter((x) => x.id !== id))
                }
              />
            );
          })}
        </SortableContext>

        <button type="button" className="add-r1-btn" onClick={handleAddRow1}>
          <Plus className="w-3.5 h-3.5" />
          <span>대분류 추가</span>
        </button>
      </div>
    </DndContext>
  );
}

function ConfirmLeaveDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="dlg" style={{ minWidth: 320, maxWidth: 480 }}>
      <h2>변경사항 확인</h2>
      <div style={{ padding: "12px 0", fontSize: 13.5, lineHeight: 1.5 }}>
        저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?
      </div>
      <div className="dlg-actions">
        <button type="button" className="dlg-btn" onClick={onCancel} autoFocus>
          취소
        </button>
        <button
          type="button"
          className="dlg-btn dlg-btn-destructive"
          onClick={onConfirm}
        >
          변경사항 버리고 나가기
        </button>
      </div>
    </div>
  );
}

function Row1Section({
  r1,
  leaves,
  protected: isProtected,
  onRenameR1,
  onDeleteR1,
  onAddLeaf,
  onRenameLeaf,
  onDeleteLeaf,
}: {
  r1: TemplateColumnItem;
  leaves: TemplateLeafItem[];
  protected: boolean;
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: r1.id, data: { kind: "r1" } });

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
    <div
      ref={setNodeRef}
      className={clsx("r1-section", isDragging && "dragging")}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="r1-head">
        <div className="r1-head-left">
          <span
            className="r1-drag-handle"
            title="드래그로 순서 변경"
            {...attributes}
            {...listeners}
          >
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
                disabled={isProtected}
                style={isProtected ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                title={isProtected ? "보호된 그룹은 삭제할 수 없습니다" : undefined}
                onClick={() => {
                  if (isProtected) return;
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
        <SortableContext
          items={leaves.map((l) => l.id)}
          strategy={horizontalListSortingStrategy}
        >
          {leaves.map((l) => (
            <LeafTag
              key={l.id}
              leaf={l}
              onRename={(label) => onRenameLeaf(l.id, label)}
              onDelete={() => onDeleteLeaf(l.id)}
            />
          ))}
        </SortableContext>
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: leaf.id,
    data: { kind: "leaf", row1_id: leaf.row1_id },
  });

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
    <span
      ref={setNodeRef}
      className={clsx("leaf-tag", isDragging && "dragging")}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      title="더블클릭으로 이름 변경"
      {...attributes}
      {...listeners}
    >
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
            onPointerDown={(e) => e.stopPropagation()}
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

import { useEffect, useState } from "react";
import { useBoard } from "@/contexts/BoardContext";
import { useSelection } from "@/contexts/SelectionContext";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "./ColorPicker";
import { useConfirm } from "@/hooks/useConfirm";
import { X } from "lucide-react";

const COUNSELOR_ROW1_IDS = ["r1_구환", "r1_신환"];

export function CardSidePanel() {
  const { snapshot, updateCard, deleteCard } = useBoard();
  const { selectedCardId, selectCard } = useSelection();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);

  const card = snapshot?.cards.find((c) => c.id === selectedCardId) ?? null;
  const [form, setForm] = useState({
    name: "",
    chart: "",
    counselor: "",
    book_time: "",
    consult_time: "",
    memo: "",
    color: "",
  });

  // 외부에서 카드 데이터 변경 시 form 동기화 (패널 닫혀있을 때만 — 열려있으면 사용자 입력 보존)
  useEffect(() => {
    if (open) return;
    if (card) {
      setForm({
        name: card.name,
        chart: card.chart,
        counselor: card.counselor,
        book_time: card.book_time,
        consult_time: card.consult_time,
        memo: card.memo,
        color: card.color,
      });
    }
  }, [
    card?.id,
    card?.name,
    card?.chart,
    card?.counselor,
    card?.book_time,
    card?.consult_time,
    card?.memo,
    card?.color,
    open,
  ]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  // 외부 트리거: 커스텀 이벤트 'kanban:open-card-panel'
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("kanban:open-card-panel", h);
    return () => window.removeEventListener("kanban:open-card-panel", h);
  }, []);

  if (!card) return null;

  const handleSave = async () => {
    await updateCard(card.id, { ...form, sync_siblings: true });
    setOpen(false);
  };

  const handleDelete = async () => {
    const ok = await confirm({ message: `"${card.name || card.chart || "(빈 카드)"}" 카드를 삭제할까요?`, danger: true });
    if (!ok) return;
    await deleteCard(card.id);
    selectCard(null);
    setOpen(false);
  };

  const handleClose = () => setOpen(false);

  const counselorOptions = Array.from(
    new Set(
      (snapshot?.columns.row2 ?? [])
        .filter((l) => COUNSELOR_ROW1_IDS.includes(l.row1_id))
        .map((l) => l.label)
    )
  );

  return (
    <div id="cardPanel" className={open ? "open" : ""}>
      <div className="card-panel-header">
        <div className="card-panel-title">카드 편집 — {card.time}</div>
        <button type="button" onClick={handleClose} className="card-panel-close">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="card-panel-body">
        <div className="card-panel-field">
          <label>환자명</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="card-panel-field">
          <label>차트번호</label>
          <Input
            value={form.chart}
            onChange={(e) => setForm({ ...form, chart: e.target.value })}
          />
        </div>
        <div className="card-panel-field">
          <label>상담사</label>
          <select
            className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm"
            value={form.counselor}
            onChange={(e) => setForm({ ...form, counselor: e.target.value })}
          >
            <option value="">(선택)</option>
            {counselorOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="card-panel-row grid grid-cols-2 gap-2">
          <div className="card-panel-field">
            <label>접수시간</label>
            <Input
              value={form.consult_time}
              onChange={(e) => setForm({ ...form, consult_time: e.target.value })}
              placeholder="HH:MM"
            />
          </div>
          <div className="card-panel-field">
            <label>예약시간</label>
            <Input
              value={form.book_time}
              onChange={(e) => setForm({ ...form, book_time: e.target.value })}
              placeholder="HH:MM"
            />
          </div>
        </div>
        <div className="card-panel-field">
          <label>메모</label>
          <Textarea
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            rows={4}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        </div>
        <div className="card-panel-field">
          <label>색상</label>
          <ColorPicker value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
        </div>
      </div>
      <div className="card-panel-actions flex gap-2 px-4 py-3 border-t">
        <Button variant="destructive" onClick={handleDelete}>
          삭제
        </Button>
        <div className="flex-1" />
        <Button onClick={handleClose}>취소</Button>
        <Button variant="primary" onClick={handleSave}>
          저장
        </Button>
      </div>
    </div>
  );
}

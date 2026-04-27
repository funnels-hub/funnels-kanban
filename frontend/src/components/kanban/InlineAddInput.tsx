import { useEffect, useRef, useState } from "react";
import { useBoard } from "@/contexts/BoardContext";
import { useAlert } from "@/hooks/useAlert";
import { parseInlineAdd, formatNowHHMM, isTimeEditableGroup } from "@/lib/business-rules";

export function InlineAddInput({
  row1Id,
  row2Id,
  time,
  onClose,
}: {
  row1Id: string;
  row2Id: string;
  time: string;
  onClose: () => void;
}) {
  const { createCard, getCardsByChart } = useBoard();
  const showAlert = useAlert();
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed) { onClose(); return; }
    const { name, chart } = parseInlineAdd(trimmed);

    let counselor = "";
    let memo = "";
    let color = "";
    if (chart) {
      try {
        const siblings = await getCardsByChart(chart);
        if (siblings.length > 0) {
          const s = siblings[0];
          counselor = s.counselor;
          memo = s.memo;
          color = s.color;
        }
      } catch {}
    }

    const isTimeEditable = isTimeEditableGroup(row1Id);
    const book_time = isTimeEditable ? time : "";
    const consult_time = isTimeEditable ? formatNowHHMM() : "";

    try {
      await createCard({
        date: "",  // BoardContext가 자동 주입
        row1_id: row1Id,
        row2_id: row2Id,
        time,
        name,
        chart,
        counselor,
        book_time,
        consult_time,
        memo,
        color,
      } as any);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "오류";
      if (msg.includes("CHART_ALREADY_EXISTS")) showAlert("이미 같은 차트가 그룹에 존재합니다", "error");
      else if (msg.includes("CELL_OCCUPIED")) showAlert("이미 카드가 있는 셀입니다", "error");
      else showAlert(msg, "error");
    }
  };

  return (
    <input
      ref={ref}
      type="text"
      className="inline-add-input"
      placeholder="이름 차트번호"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); submit(); }
        if (e.key === "Escape") { e.preventDefault(); onClose(); }
      }}
      onBlur={() => onClose()}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

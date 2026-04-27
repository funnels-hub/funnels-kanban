import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useCurrentDate } from "@/contexts/DateContext";
import { dateLabel } from "@/lib/date-utils";
import { useRef } from "react";

export function DateNav() {
  const { date, setDate, goPrev, goNext, goToday } = useCurrentDate();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={goPrev} className="hdr-icon-btn" title="이전">
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="absolute opacity-0 pointer-events-none"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.showPicker?.() ?? inputRef.current?.click()}
          className="dlg-btn flex items-center gap-1.5 text-xs px-2 py-1"
          title="날짜 선택"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>{dateLabel(date)}</span>
        </button>
      </div>

      <button type="button" onClick={goToday} className="dlg-btn text-xs px-2 py-1" title="오늘">오늘</button>
      <button type="button" onClick={goNext} className="hdr-icon-btn" title="다음">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

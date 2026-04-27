import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { todayKey, shiftDateKey } from "@/lib/date-utils";

const STORAGE_KEY = "kanban-v1c-b-current-date";

interface DateContextValue {
  date: string;
  setDate: (d: string) => void;
  goPrev: () => void;
  goNext: () => void;
  goToday: () => void;
}

const DateContext = createContext<DateContextValue | null>(null);

export function DateProvider({ children }: { children: ReactNode }) {
  const [date, setDateState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || todayKey();
  });
  const setDate = useCallback((d: string) => {
    setDateState(d);
    localStorage.setItem(STORAGE_KEY, d);
  }, []);
  const goPrev = useCallback(() => setDate(shiftDateKey(date, -1)), [date, setDate]);
  const goNext = useCallback(() => setDate(shiftDateKey(date, 1)), [date, setDate]);
  const goToday = useCallback(() => setDate(todayKey()), [setDate]);

  return <DateContext.Provider value={{ date, setDate, goPrev, goNext, goToday }}>{children}</DateContext.Provider>;
}

export function useCurrentDate(): DateContextValue {
  const ctx = useContext(DateContext);
  if (!ctx) throw new Error("useCurrentDate must be used within DateProvider");
  return ctx;
}

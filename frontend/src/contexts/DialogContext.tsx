import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface DialogContextValue {
  dialog: ReactNode | null;
  openDialog: (content: ReactNode) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ReactNode | null>(null);
  const openDialog = useCallback((content: ReactNode) => setDialog(content), []);
  const closeDialog = useCallback(() => setDialog(null), []);
  return <DialogContext.Provider value={{ dialog, openDialog, closeDialog }}>{children}</DialogContext.Provider>;
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be inside DialogProvider");
  return ctx;
}

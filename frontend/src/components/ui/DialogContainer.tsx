import { useEffect } from "react";
import { useDialog } from "@/contexts/DialogContext";

export function DialogContainer() {
  const { dialog, closeDialog } = useDialog();
  useEffect(() => {
    if (!dialog) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDialog();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dialog, closeDialog]);

  if (!dialog) return null;

  return (
    <div className="dlg-overlay open" onClick={(e) => { if (e.target === e.currentTarget) closeDialog(); }}>
      <div onClick={(e) => e.stopPropagation()}>
        {dialog}
      </div>
    </div>
  );
}

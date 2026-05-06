import { useEffect, useRef } from "react";
import { useDialog } from "@/contexts/DialogContext";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { closeDialog } = useDialog();
  const settledRef = useRef(false);

  useEffect(() => {
    return () => {
      if (!settledRef.current) onCancel();
    };
  }, [onCancel]);

  const handleConfirm = () => {
    settledRef.current = true;
    onConfirm();
    closeDialog();
  };

  const handleCancel = () => {
    settledRef.current = true;
    onCancel();
    closeDialog();
  };

  return (
    <div className="dlg" style={{ minWidth: 320, maxWidth: 480 }}>
      {title && (
        <h2 style={{ color: danger ? "#dc2626" : undefined }}>{title}</h2>
      )}
      <div style={{ padding: "12px 0", fontSize: 13.5, lineHeight: 1.5 }}>
        {message}
      </div>
      <div className="dlg-actions">
        <button type="button" className="dlg-btn" onClick={handleCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`dlg-btn ${danger ? "dlg-btn-destructive" : "dlg-btn-primary"}`}
          onClick={handleConfirm}
          autoFocus
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

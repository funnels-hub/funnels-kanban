import { useDialog } from "@/contexts/DialogContext";

export function AlertDialog({
  message,
  kind = "info",
}: {
  message: string;
  kind?: "info" | "success" | "error";
}) {
  const { closeDialog } = useDialog();
  const title = kind === "error" ? "오류" : kind === "success" ? "완료" : "알림";
  return (
    <div className="dlg" style={{ minWidth: 320, maxWidth: 480 }}>
      <h2 style={{ color: kind === "error" ? "#dc2626" : undefined }}>
        {title}
      </h2>
      <div style={{ padding: "12px 0", fontSize: 13.5, lineHeight: 1.5 }}>
        {message}
      </div>
      <div className="dlg-actions">
        <button
          type="button"
          className="dlg-btn dlg-btn-primary"
          onClick={closeDialog}
          autoFocus
        >
          확인
        </button>
      </div>
    </div>
  );
}

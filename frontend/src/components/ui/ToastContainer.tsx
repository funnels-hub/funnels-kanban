import { useToast } from "@/contexts/ToastContext";

export function ToastContainer() {
  const { toasts } = useToast();
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind} pointer-events-auto`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

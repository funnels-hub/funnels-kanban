import { useDialog } from "@/contexts/DialogContext";
import { AlertDialog } from "@/components/ui/AlertDialog";

export function useAlert() {
  const { openDialog } = useDialog();
  return (message: string, kind: "info" | "success" | "error" = "info") => {
    openDialog(<AlertDialog message={message} kind={kind} />);
  };
}

import { useCallback, useRef } from "react";
import { useDialog } from "@/contexts/DialogContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function useConfirm() {
  const { openDialog } = useDialog();
  const pendingResolverRef = useRef<((value: boolean) => void) | null>(null);

  return useCallback(
    (opts: ConfirmOptions): Promise<boolean> => {
      if (pendingResolverRef.current) {
        pendingResolverRef.current(false);
        pendingResolverRef.current = null;
      }
      return new Promise<boolean>((resolve) => {
        const settle = (value: boolean) => {
          if (pendingResolverRef.current === resolve) {
            pendingResolverRef.current = null;
          }
          resolve(value);
        };
        pendingResolverRef.current = resolve;
        openDialog(
          <ConfirmDialog
            title={opts.title}
            message={opts.message}
            confirmLabel={opts.confirmLabel}
            cancelLabel={opts.cancelLabel}
            danger={opts.danger}
            onConfirm={() => settle(true)}
            onCancel={() => settle(false)}
          />
        );
      });
    },
    [openDialog]
  );
}

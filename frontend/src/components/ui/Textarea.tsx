import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-16 w-full rounded-md border border-border bg-background px-2 py-1 text-sm",
        "outline-none focus:ring-2 focus:ring-ring/50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

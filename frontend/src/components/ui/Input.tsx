import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-8 w-full rounded-md border border-border bg-background px-2 py-1 text-sm",
        "outline-none focus:ring-2 focus:ring-ring/50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, Props>(({ icon, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-secondary",
        "text-foreground transition-colors",
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
});
IconButton.displayName = "IconButton";

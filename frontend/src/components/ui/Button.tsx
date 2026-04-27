import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "destructive" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  default: "dlg-btn",
  primary: "dlg-btn dlg-btn-primary",
  destructive: "dlg-btn dlg-btn-destructive",
  ghost: "dlg-btn dlg-btn-ghost",
};

export const Button = forwardRef<HTMLButtonElement, Props>(({ className, variant = "default", ...props }, ref) => {
  return <button ref={ref} type="button" className={cn(variantClass[variant], className)} {...props} />;
});
Button.displayName = "Button";

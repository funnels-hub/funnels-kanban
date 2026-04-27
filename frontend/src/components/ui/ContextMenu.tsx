import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const style: CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 200,
  };

  return (
    <div ref={ref} className="ctx-menu" style={style}>
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          className={`ctx-menu-item ${it.destructive ? "destructive" : ""}`}
          disabled={it.disabled}
          onClick={() => {
            if (!it.disabled) {
              it.onClick();
              onClose();
            }
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

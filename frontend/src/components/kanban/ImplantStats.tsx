import { useMemo } from "react";
import { useBoard } from "@/contexts/BoardContext";

export function ImplantStats() {
  const { snapshot } = useBoard();

  const stats = useMemo(() => {
    if (!snapshot) return null;
    const implantLeaves = snapshot.columns.row2
      .filter((r) => r.row1_id === "r1_임플")
      .sort((a, b) => a.position - b.position);
    const counts = new Map<string, number>();
    for (const r of implantLeaves) counts.set(r.id, 0);
    for (const c of snapshot.cards) {
      if (c.row1_id === "r1_임플") {
        counts.set(c.row2_id, (counts.get(c.row2_id) ?? 0) + 1);
      }
    }
    return implantLeaves.map((r) => ({ id: r.id, label: r.label, count: counts.get(r.id) ?? 0 }));
  }, [snapshot]);

  if (!stats || stats.length === 0) return null;

  return (
    <div className="implant-stats text-xs flex items-center flex-wrap gap-x-2 gap-y-0.5">
      <span className="font-semibold text-foreground">임플:</span>
      {stats.map((s, idx) => (
        <span key={s.id} className="inline-flex items-center gap-1">
          {idx > 0 && <span className="text-muted-foreground/50">·</span>}
          <span className={s.count > 0 ? "stat-nonzero text-foreground font-medium" : "stat-zero text-muted-foreground"}>
            {s.label} <b>{s.count}</b>
          </span>
        </span>
      ))}
    </div>
  );
}

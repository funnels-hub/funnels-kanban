import { useMemo } from "react";
import { useBoard } from "@/contexts/BoardContext";
import {
  R1_LEAF_WIDTH,
  DEFAULT_LEAF_WIDTH,
  ADD_CELL_WIDTH,
  TIME_CELL_WIDTH,
  TIME_SLOTS,
} from "@/lib/constants";
import { HeaderRow1 } from "./HeaderRow1";
import { HeaderRow2 } from "./HeaderRow2";
import { HeaderAddCell } from "./HeaderAddCell";
import { Cell } from "./Cell";

type Snapshot = NonNullable<ReturnType<typeof useBoard>["snapshot"]>;
type Row1Col = Snapshot["columns"]["row1"][number];
type Row2Col = Snapshot["columns"]["row2"][number];
type Card = Snapshot["cards"][number];

type Group = {
  r1: Row1Col;
  leaves: Row2Col[];
  leafW: number;
};

export function KanbanGrid() {
  const { snapshot } = useBoard();

  const layout = useMemo(() => {
    if (!snapshot) return null;
    const sortedR1 = [...snapshot.columns.row1].sort(
      (a, b) => a.position - b.position
    );
    const leavesByR1 = new Map<string, Row2Col[]>();
    for (const r1 of sortedR1) leavesByR1.set(r1.id, []);
    for (const r2 of snapshot.columns.row2) {
      const arr = leavesByR1.get(r2.row1_id);
      if (arr) arr.push(r2);
    }
    for (const arr of leavesByR1.values())
      arr.sort((a, b) => a.position - b.position);

    const groups: Group[] = sortedR1.map((r1) => {
      const leaves = leavesByR1.get(r1.id) ?? [];
      const leafW = R1_LEAF_WIDTH[r1.id] ?? DEFAULT_LEAF_WIDTH;
      return { r1, leaves, leafW };
    });

    const colTemplate = [
      `${TIME_CELL_WIDTH}px`,
      ...groups.flatMap((g) => [
        ...g.leaves.map(() => `${g.leafW}px`),
        `${ADD_CELL_WIDTH}px`,
      ]),
      `${ADD_CELL_WIDTH}px`,
    ].join(" ");

    return { groups, colTemplate };
  }, [snapshot]);

  if (!snapshot || !layout) return null;

  const cardsByCell = new Map<string, Card[]>();
  for (const c of snapshot.cards) {
    const k = `${c.row1_id}|${c.row2_id}|${c.time}`;
    if (!cardsByCell.has(k)) cardsByCell.set(k, []);
    cardsByCell.get(k)!.push(c);
  }

  return (
    <div className="overflow-auto kanban-scroll flex-1">
      <div
        className="kanban-grid"
        style={{ gridTemplateColumns: layout.colTemplate }}
      >
        {/* Row 1: time-cell-hdr corner + row1 headers + +row1 add cell */}
        <div className="hdr time-cell-hdr"></div>
        {layout.groups.map((g, idx) => {
          const span = g.leaves.length + 1;
          return (
            <HeaderRow1
              key={g.r1.id}
              row1={g.r1}
              span={span}
              groupIndex={idx}
            />
          );
        })}
        <HeaderAddCell type="row1" />

        {/* Row 2: time-cell-hdr + row2 headers + add-leaf cells */}
        <div className="hdr time-cell-hdr"></div>
        {layout.groups.map((g, idx) => (
          <Row2Fragment key={g.r1.id} group={g} groupIndex={idx} />
        ))}
        <div className="hdr"></div>

        {/* Time rows */}
        {TIME_SLOTS.map((time) => (
          <TimeRowFragment
            key={time}
            time={time}
            groups={layout.groups}
            cardsByCell={cardsByCell}
          />
        ))}
      </div>
    </div>
  );
}

function Row2Fragment({
  group,
  groupIndex,
}: {
  group: Group;
  groupIndex: number;
}) {
  return (
    <>
      {group.leaves.map((r2, leafIdx) => (
        <HeaderRow2
          key={r2.id}
          row2={r2}
          groupIndex={groupIndex}
          isFirstLeaf={leafIdx === 0}
        />
      ))}
      <HeaderAddCell type="row2" row1Id={group.r1.id} />
    </>
  );
}

function TimeRowFragment({
  time,
  groups,
  cardsByCell,
}: {
  time: string;
  groups: Group[];
  cardsByCell: Map<string, Card[]>;
}) {
  return (
    <>
      <div className="time-cell">{time}</div>
      {groups.map((g, gIdx) => (
        <CellGroupFragment
          key={g.r1.id}
          group={g}
          groupIndex={gIdx}
          time={time}
          cardsByCell={cardsByCell}
        />
      ))}
      <div className="cell" />
    </>
  );
}

function CellGroupFragment({
  group,
  groupIndex,
  time,
  cardsByCell,
}: {
  group: Group;
  groupIndex: number;
  time: string;
  cardsByCell: Map<string, Card[]>;
}) {
  return (
    <>
      {group.leaves.map((r2, leafIdx) => {
        const k = `${group.r1.id}|${r2.id}|${time}`;
        const cardsHere = cardsByCell.get(k) ?? [];
        return (
          <Cell
            key={r2.id}
            row1Id={group.r1.id}
            row2Id={r2.id}
            time={time}
            cards={cardsHere}
            groupIndex={groupIndex}
            isFirstLeaf={leafIdx === 0}
          />
        );
      })}
      <div className="cell" />
    </>
  );
}

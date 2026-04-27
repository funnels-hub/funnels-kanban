import { COLOR_PALETTE } from "@/lib/constants";

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="color-picker">
      <button
        type="button"
        className={`color-swatch color-default ${value === "" ? "active" : ""}`}
        onClick={() => onChange("")}
        title="기본"
      />
      {COLOR_PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          className={`color-swatch ${value === c ? "active" : ""}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
        />
      ))}
    </div>
  );
}

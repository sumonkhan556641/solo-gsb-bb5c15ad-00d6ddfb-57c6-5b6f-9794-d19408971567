interface Props {
  value: number;
  onChange: (v: number) => void;
  step?: string;
  min?: string;
  placeholder?: string;
}

/** 数字输入框：允许输入过程中出现空值，失焦/变化时回传解析后的数字。 */
export default function NumberInput({ value, onChange, step, min, placeholder }: Props) {
  return (
    <input
      type="number"
      step={step ?? "any"}
      min={min}
      placeholder={placeholder}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "" ? 0 : Number(raw));
      }}
    />
  );
}

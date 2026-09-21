import { useState } from "react";
import NumberInput from "./NumberInput";

interface Props {
  oxides: string[];
  target: Record<string, number>;
  onTargetChange: (oxide: string, value: number) => void;
  onAddOxide: (name: string) => void;
  onRemoveOxide: (name: string) => void;
}

export default function TargetEditor({ oxides, target, onTargetChange, onAddOxide, onRemoveOxide }: Props) {
  const [newOxide, setNewOxide] = useState("");
  const total = oxides.reduce((s, o) => s + (target[o] ?? 0), 0);

  return (
    <section className="card">
      <h2>① 目标氧化物比例（%）</h2>
      <table>
        <thead>
          <tr>
            <th>氧化物</th>
            <th>目标 %</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {oxides.map((o) => (
            <tr key={o}>
              <td className="oxide-name">{o}</td>
              <td>
                <NumberInput value={target[o] ?? 0} onChange={(v) => onTargetChange(o, v)} />
              </td>
              <td>
                <button className="btn-icon" title="删除该氧化物" onClick={() => onRemoveOxide(o)}>
                  ×
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <input
                placeholder="新氧化物，如 TiO2"
                value={newOxide}
                onChange={(e) => setNewOxide(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newOxide.trim()) {
                    onAddOxide(newOxide.trim());
                    setNewOxide("");
                  }
                }}
              />
            </td>
            <td colSpan={2}>
              <button
                className="btn"
                onClick={() => {
                  if (newOxide.trim()) {
                    onAddOxide(newOxide.trim());
                    setNewOxide("");
                  }
                }}
              >
                + 添加氧化物
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>合计</td>
            <td colSpan={2} className={Math.abs(total - 100) > 1e-6 ? "warn-text" : ""}>
              {total.toFixed(2)} %{Math.abs(total - 100) > 1e-6 && "（求解时将自动归一化到 100）"}
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

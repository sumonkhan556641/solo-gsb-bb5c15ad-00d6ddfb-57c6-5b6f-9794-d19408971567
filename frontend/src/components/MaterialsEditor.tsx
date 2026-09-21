import type { Material } from "../types";
import NumberInput from "./NumberInput";

interface Props {
  oxides: string[];
  materials: Material[];
  onChange: (materials: Material[]) => void;
}

export default function MaterialsEditor({ oxides, materials, onChange }: Props) {
  const update = (idx: number, patch: Partial<Material>) => {
    onChange(materials.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };
  const updateOxide = (idx: number, oxide: string, value: number) => {
    const m = materials[idx];
    update(idx, { oxides: { ...m.oxides, [oxide]: value } });
  };
  const addMaterial = () => {
    onChange([
      ...materials,
      { name: `原料${materials.length + 1}`, oxides: {}, min: 0, max: 100, disabled: false },
    ]);
  };
  const removeMaterial = (idx: number) => {
    onChange(materials.filter((_, i) => i !== idx));
  };

  return (
    <section className="card">
      <h2>② 原料氧化物组成（%）与用量约束</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>启用</th>
              <th>原料名称</th>
              <th>最小用量</th>
              <th>最大用量</th>
              {oxides.map((o) => (
                <th key={o}>{o}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m, i) => (
              <tr key={i} className={m.disabled ? "row-disabled" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={!m.disabled}
                    onChange={(e) => update(i, { disabled: !e.target.checked })}
                  />
                </td>
                <td>
                  <input
                    className="name-input"
                    value={m.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                  />
                </td>
                <td>
                  <NumberInput value={m.min} onChange={(v) => update(i, { min: v })} />
                </td>
                <td>
                  <NumberInput value={m.max} onChange={(v) => update(i, { max: v })} />
                </td>
                {oxides.map((o) => (
                  <td key={o}>
                    <NumberInput
                      value={m.oxides[o] ?? 0}
                      onChange={(v) => updateOxide(i, o, v)}
                    />
                  </td>
                ))}
                <td>
                  <button className="btn-icon" title="删除原料" onClick={() => removeMaterial(i)}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn" onClick={addMaterial}>
        + 添加原料
      </button>
      <p className="hint">
        取消勾选「启用」即禁用该原料（用量固定为 0）；最小/最大用量以总配方 100 份计。
      </p>
    </section>
  );
}

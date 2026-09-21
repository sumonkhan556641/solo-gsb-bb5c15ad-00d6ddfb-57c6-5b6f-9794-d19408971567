import { useRef, useState } from "react";
import type { SolveInput } from "../types";

interface Props {
  input: SolveInput;
  onImport: (data: SolveInput) => void;
}

function validate(data: unknown): SolveInput {
  if (typeof data !== "object" || data === null) throw new Error("JSON 顶层必须是对象");
  const d = data as Record<string, unknown>;
  if (typeof d.target !== "object" || d.target === null) throw new Error("缺少 target 对象");
  if (!Array.isArray(d.materials)) throw new Error("缺少 materials 数组");
  const target: Record<string, number> = {};
  for (const [k, v] of Object.entries(d.target as Record<string, unknown>)) {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error(`target.${k} 不是数字`);
    target[k] = n;
  }
  const materials = (d.materials as unknown[]).map((raw, i) => {
    const m = raw as Record<string, unknown>;
    if (typeof m.name !== "string" || !m.name) throw new Error(`materials[${i}] 缺少 name`);
    const oxides: Record<string, number> = {};
    for (const [k, v] of Object.entries((m.oxides ?? {}) as Record<string, unknown>)) {
      const n = Number(v);
      if (!Number.isFinite(n)) throw new Error(`materials[${i}].oxides.${k} 不是数字`);
      oxides[k] = n;
    }
    return {
      name: m.name,
      oxides,
      min: Number.isFinite(Number(m.min)) ? Number(m.min) : 0,
      max: Number.isFinite(Number(m.max)) ? Number(m.max) : 100,
      disabled: Boolean(m.disabled),
    };
  });
  return { target, materials };
}

export default function JsonPanel({ input, onImport }: Props) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = () => {
    const json = JSON.stringify(input, null, 2);
    setText(json);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "glaze-recipe.json";
    a.click();
    URL.revokeObjectURL(url);
    setMessage("已导出并下载 glaze-recipe.json");
  };

  const doImport = (json: string) => {
    try {
      const data = validate(JSON.parse(json));
      onImport(data);
      setMessage("导入成功");
    } catch (e) {
      setMessage(`导入失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <section className="card">
      <h2>③ 配方 JSON 导入 / 导出</h2>
      <div className="btn-row">
        <button className="btn" onClick={doExport}>
          导出 JSON
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          从文件导入…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              file.text().then((t) => {
                setText(t);
                doImport(t);
              });
            }
            e.target.value = "";
          }}
        />
      </div>
      <textarea
        rows={8}
        placeholder='粘贴 {"target": {...}, "materials": [...]} 后点击「从文本导入」'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="btn-row">
        <button className="btn" onClick={() => doImport(text)}>
          从文本导入
        </button>
      </div>
      {message && <p className="hint">{message}</p>}
    </section>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSample, solveRecipe } from "./api";
import JsonPanel from "./components/JsonPanel";
import MaterialsEditor from "./components/MaterialsEditor";
import ResultView from "./components/ResultView";
import TargetEditor from "./components/TargetEditor";
import type { Material, SolveInput, SolveResponse } from "./types";

export default function App() {
  const [target, setTarget] = useState<Record<string, number>>({});
  const [materials, setMaterials] = useState<Material[]>([]);
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 氧化物列表 = 目标与所有原料组成中出现过的氧化物的并集
  const oxides = useMemo(
    () =>
      Array.from(
        new Set([
          ...Object.keys(target),
          ...materials.flatMap((m) => Object.keys(m.oxides)),
        ])
      ).sort(),
    [target, materials]
  );

  const applyInput = useCallback((data: SolveInput) => {
    setTarget(data.target);
    setMaterials(data.materials);
    setResult(null);
    setError(null);
  }, []);

  const loadSample = useCallback(async () => {
    try {
      applyInput(await fetchSample());
    } catch (e) {
      setError(`载入示例失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [applyInput]);

  useEffect(() => {
    void loadSample();
  }, [loadSample]);

  const addOxide = (name: string) => {
    if (!oxides.includes(name)) setTarget((t) => ({ ...t, [name]: 0 }));
  };
  const removeOxide = (name: string) => {
    setTarget((t) => {
      const next = { ...t };
      delete next[name];
      return next;
    });
    setMaterials((ms) =>
      ms.map((m) => {
        const o = { ...m.oxides };
        delete o[name];
        return { ...m, oxides: o };
      })
    );
  };

  const solve = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await solveRecipe({ target, materials }));
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>釉料配方反推</h1>
        <p className="hint">
          录入目标氧化物比例与各原料组成，求解总量为 100、满足用量边界的最小残差配方。
        </p>
        <div className="btn-row">
          <button className="btn" onClick={loadSample}>
            载入示例数据
          </button>
          <button className="btn btn-primary" disabled={loading} onClick={solve}>
            {loading ? "求解中…" : "求解配方"}
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
      </header>

      <TargetEditor
        oxides={oxides}
        target={target}
        onTargetChange={(o, v) => setTarget((t) => ({ ...t, [o]: v }))}
        onAddOxide={addOxide}
        onRemoveOxide={removeOxide}
      />

      <MaterialsEditor oxides={oxides} materials={materials} onChange={setMaterials} />

      <JsonPanel input={{ target, materials }} onImport={applyInput} />

      {result && <ResultView result={result} />}
    </div>
  );
}

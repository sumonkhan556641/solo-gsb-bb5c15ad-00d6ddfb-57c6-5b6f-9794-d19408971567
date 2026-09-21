import type { SolveResponse } from "../types";

const DEV_THRESHOLD = 0.005; // 偏差超过 0.005 个百分点即高亮

export default function ResultView({ result }: { result: SolveResponse }) {
  if (result.status === "conflict") {
    return (
      <section className="card">
        <h2>求解结果</h2>
        <div className="alert alert-error">
          <strong>边界条件相互矛盾，无法求解：</strong>
          <ul>
            {result.conflicts.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  if (result.status === "error") {
    return (
      <section className="card">
        <h2>求解结果</h2>
        <div className="alert alert-error">
          <strong>求解失败：</strong>
          <ul>
            {result.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  const total = result.recipe.reduce((s, r) => s + r.amount, 0);

  return (
    <section className="card">
      <h2>求解结果</h2>
      {result.exact ? (
        <div className="alert alert-ok">✓ 目标可精确达到（残差 {result.residual}）</div>
      ) : (
        <div className="alert alert-warn">
          ⚠ 目标不可精确达到，已返回残差最小的最近配方（总残差 {result.residual} 个百分点）
        </div>
      )}
      {result.notes.map((n, i) => (
        <div key={i} className="alert alert-info">
          {n}
        </div>
      ))}

      <h3>配方（总量 {total.toFixed(2)} 份）</h3>
      <table>
        <thead>
          <tr>
            <th>原料</th>
            <th>用量</th>
            <th>占比 %</th>
            <th>约束区间</th>
          </tr>
        </thead>
        <tbody>
          {result.recipe.map((r) => (
            <tr key={r.name} className={r.disabled ? "row-disabled" : ""}>
              <td>{r.name}{r.disabled && "（已禁用）"}</td>
              <td>{r.amount.toFixed(4)}</td>
              <td>{((r.amount / (total || 1)) * 100).toFixed(2)}</td>
              <td>
                [{r.min}, {r.max}]
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>氧化物对比（%）</h3>
      <table>
        <thead>
          <tr>
            <th>氧化物</th>
            <th>目标</th>
            <th>计算值</th>
            <th>偏差</th>
          </tr>
        </thead>
        <tbody>
          {result.oxides.map((o) => {
            const dev = result.deviation[o] ?? 0;
            const cls = Math.abs(dev) > DEV_THRESHOLD ? "dev-bad" : "dev-ok";
            return (
              <tr key={o}>
                <td className="oxide-name">{o}</td>
                <td>{(result.target[o] ?? 0).toFixed(4)}</td>
                <td>{(result.computed[o] ?? 0).toFixed(4)}</td>
                <td className={cls}>
                  {dev > 0 ? "+" : ""}
                  {dev.toFixed(4)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

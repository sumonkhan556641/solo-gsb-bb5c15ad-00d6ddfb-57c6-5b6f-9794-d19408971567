"""釉料配方反推求解器。

问题模型：
    给定目标氧化物质量分数 b（归一化到总和 100），以及 n 种原料的氧化物
    组成矩阵 M（M[o, i] 为原料 i 中氧化物 o 的质量分数 / 100），求用量
    向量 x（sum(x) = 100, lb <= x <= ub），使 ||M x - b||^2 最小。

使用 scipy SLSQP（等式约束 + 边界约束）精确求解该有界最小二乘问题。
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from scipy.optimize import Bounds, LinearConstraint, minimize

TOTAL = 100.0
# 残差（各氧化物偏差平方和的平方根，单位：百分点）低于该值视为精确达到
EXACT_TOL = 1e-4
EPS = 1e-9


@dataclass
class Material:
    name: str
    oxides: dict[str, float]
    min: float = 0.0
    max: float = TOTAL
    disabled: bool = False


@dataclass
class SolveResult:
    status: str  # "ok" | "conflict" | "error"
    conflicts: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    oxides: list[str] = field(default_factory=list)
    recipe: list[dict] = field(default_factory=list)
    target: dict[str, float] = field(default_factory=dict)
    computed: dict[str, float] = field(default_factory=dict)
    deviation: dict[str, float] = field(default_factory=dict)
    residual: float | None = None
    exact: bool = False


def _check_conflicts(materials: list[Material]) -> list[str]:
    """检查边界约束本身是否矛盾（在求解之前）。"""
    conflicts: list[str] = []
    enabled = [m for m in materials if not m.disabled]

    for m in materials:
        if m.min < 0:
            conflicts.append(f"原料「{m.name}」的最小用量为负数（{m.min}）")
        if m.max < 0:
            conflicts.append(f"原料「{m.name}」的最大用量为负数（{m.max}）")
        if m.min > m.max + EPS:
            conflicts.append(
                f"原料「{m.name}」的最小用量 {m.min} 大于最大用量 {m.max}"
            )

    if not enabled:
        conflicts.append("没有可用的原料：所有原料均被禁用")
        return conflicts

    sum_min = sum(m.min for m in enabled)
    sum_max = sum(m.max for m in enabled)
    if sum_min > TOTAL + EPS:
        detail = "、".join(f"{m.name}≥{m.min}" for m in enabled if m.min > 0)
        conflicts.append(
            f"所有启用原料的最小用量之和为 {round(sum_min, 6)}，超过总量 "
            f"{TOTAL}（{detail}）"
        )
    if sum_max < TOTAL - EPS:
        detail = "、".join(f"{m.name}≤{m.max}" for m in enabled)
        conflicts.append(
            f"所有启用原料的最大用量之和为 {round(sum_max, 6)}，小于总量 "
            f"{TOTAL}（{detail}）"
        )
    return conflicts


def solve_recipe(target: dict[str, float], materials: list[Material]) -> SolveResult:
    # ---- 输入校验 ----
    conflicts = _check_conflicts(materials)
    for oxide, value in target.items():
        if value < 0:
            conflicts.append(f"目标氧化物 {oxide} 的比例为负数（{value}）")
    for m in materials:
        for oxide, value in m.oxides.items():
            if value < 0:
                conflicts.append(f"原料「{m.name}」中 {oxide} 的含量为负数（{value}）")
    if conflicts:
        return SolveResult(status="conflict", conflicts=conflicts)

    target_sum = sum(target.values())
    if target_sum <= EPS:
        return SolveResult(
            status="conflict", conflicts=["目标氧化物比例全部为空或为 0，无法求解"]
        )

    notes: list[str] = []
    # 目标归一化到 100
    if abs(target_sum - TOTAL) > EPS:
        notes.append(
            f"目标氧化物总和为 {round(target_sum, 6)}，已按比例归一化到 {TOTAL}"
        )
    b = np.array(
        [target.get(o, 0.0) / target_sum * TOTAL for o in sorted(target)]
    )
    oxide_names = sorted(target)
    # 原料中出现但目标中未列出的氧化物也要纳入（目标视为 0）
    extra = sorted(
        {o for m in materials if not m.disabled for o in m.oxides} - set(oxide_names)
    )
    if extra:
        oxide_names += extra
        b = np.concatenate([b, np.zeros(len(extra))])
        notes.append(f"氧化物 {', '.join(extra)} 未在目标中给出，按目标值 0 处理")

    enabled = [m for m in materials if not m.disabled]
    n = len(enabled)
    # M[o, i]：原料 i 中氧化物 o 的质量分数（小数）
    M = np.array(
        [[m.oxides.get(o, 0.0) / 100.0 for m in enabled] for o in oxide_names]
    )

    lb = np.array([m.min for m in enabled], dtype=float)
    ub = np.array([m.max for m in enabled], dtype=float)

    # ---- 构造可行初始点：先取下界，再按剩余上界空间比例补足到 100 ----
    x0 = lb.copy()
    remaining = TOTAL - x0.sum()
    room = ub - lb
    if room.sum() > EPS:
        x0 += remaining * room / room.sum()
    x0 = np.clip(x0, lb, ub)

    def objective(x: np.ndarray) -> float:
        r = M @ x - b
        return 0.5 * float(r @ r)

    def jacobian(x: np.ndarray) -> np.ndarray:
        return M.T @ (M @ x - b)

    eq_constraint = [LinearConstraint(np.ones(n), TOTAL, TOTAL)]
    res = minimize(
        objective,
        x0,
        jac=jacobian,
        method="SLSQP",
        bounds=Bounds(lb, ub),
        constraints=eq_constraint,
        options={"maxiter": 500, "ftol": 1e-10},
    )
    if not res.success:
        # SLSQP 偶发线搜索失败时，用 trust-constr 重试
        res = minimize(
            objective,
            x0,
            jac=jacobian,
            method="trust-constr",
            bounds=Bounds(lb, ub),
            constraints=eq_constraint,
            options={"maxiter": 2000, "gtol": 1e-12, "xtol": 1e-12},
        )
    if not res.success:
        return SolveResult(
            status="error",
            notes=[f"求解器未能收敛：{res.message}"],
            conflicts=[],
        )

    x = np.clip(res.x, lb, ub)
    computed = M @ x
    deviation = computed - b
    residual = float(np.sqrt(np.sum(deviation**2)))
    exact = residual < EXACT_TOL

    amount_by_id = {id(m): float(a) for m, a in zip(enabled, x)}
    recipe = [
        {
            "name": m.name,
            "amount": 0.0 if m.disabled else round(amount_by_id[id(m)], 6),
            "min": m.min,
            "max": m.max,
            "disabled": m.disabled,
        }
        for m in materials
    ]

    if not exact:
        notes.append(
            "目标氧化物比例在给定原料与边界条件下无法精确达到，"
            "以下为残差最小的最近配方"
        )

    return SolveResult(
        status="ok",
        notes=notes,
        oxides=oxide_names,
        recipe=recipe,
        target={o: round(float(v), 6) for o, v in zip(oxide_names, b)},
        computed={o: round(float(v), 6) for o, v in zip(oxide_names, computed)},
        deviation={o: round(float(v), 6) for o, v in zip(oxide_names, deviation)},
        residual=round(residual, 6),
        exact=exact,
    )

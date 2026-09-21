"""求解器的单元测试，可用 `python3 -m pytest tests/` 或 `python3 tests/test_solver.py` 运行。"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.sample_data import SAMPLE
from app.solver import Material, solve_recipe


def _materials(raw):
    return [Material(**m) for m in raw]


def test_sample_exact_solution():
    """示例数据存在精确解：钾长石30 石英29 高岭土8 方解石8 滑石8 氧化锌1.5 硼熔块15.5。"""
    result = solve_recipe(SAMPLE["target"], _materials(SAMPLE["materials"]))
    assert result.status == "ok"
    assert result.exact, f"residual={result.residual}"
    amounts = {r["name"]: r["amount"] for r in result.recipe}
    assert abs(sum(amounts.values()) - 100.0) < 1e-6
    assert abs(amounts["钾长石"] - 30.0) < 1e-3
    assert abs(amounts["硼熔块"] - 15.5) < 1e-3
    # 禁用原料用量必须为 0
    assert amounts["金红石"] == 0.0
    # 逐项偏差应接近 0
    for dev in result.deviation.values():
        assert abs(dev) < 1e-3


def test_conflicting_bounds_sum_min():
    mats = [
        Material("A", {"SiO2": 100.0}, min=60, max=100),
        Material("B", {"SiO2": 50.0, "Al2O3": 50.0}, min=50, max=100),
    ]
    result = solve_recipe({"SiO2": 80.0, "Al2O3": 20.0}, mats)
    assert result.status == "conflict"
    assert any("最小用量之和" in c for c in result.conflicts)


def test_conflicting_bounds_sum_max():
    mats = [
        Material("A", {"SiO2": 100.0}, min=0, max=40),
        Material("B", {"SiO2": 50.0, "Al2O3": 50.0}, min=0, max=50),
    ]
    result = solve_recipe({"SiO2": 80.0, "Al2O3": 20.0}, mats)
    assert result.status == "conflict"
    assert any("最大用量之和" in c for c in result.conflicts)


def test_conflicting_bounds_min_gt_max():
    mats = [Material("A", {"SiO2": 100.0}, min=60, max=30)]
    result = solve_recipe({"SiO2": 100.0}, mats)
    assert result.status == "conflict"
    assert any("大于最大用量" in c for c in result.conflicts)


def test_all_disabled():
    mats = [Material("A", {"SiO2": 100.0}, disabled=True)]
    result = solve_recipe({"SiO2": 100.0}, mats)
    assert result.status == "conflict"
    assert any("禁用" in c for c in result.conflicts)


def test_unreachable_target_returns_closest():
    """单一原料无法达到目标时，返回最近配方并给出逐项偏差。"""
    mats = [Material("石英", {"SiO2": 100.0})]
    result = solve_recipe({"SiO2": 90.0, "Al2O3": 10.0}, mats)
    assert result.status == "ok"
    assert not result.exact
    assert result.recipe[0]["amount"] == 100.0
    assert abs(result.computed["SiO2"] - 100.0) < 1e-6
    assert abs(result.deviation["SiO2"] - 10.0) < 1e-6
    assert abs(result.deviation["Al2O3"] + 10.0) < 1e-6
    assert result.residual > 0


def test_bounds_respected():
    """用量必须落在边界内且总量为 100。"""
    mats = [
        Material("A", {"SiO2": 100.0}, min=20, max=50),
        Material("B", {"SiO2": 50.0, "Al2O3": 50.0}, min=0, max=100),
    ]
    result = solve_recipe({"SiO2": 70.0, "Al2O3": 30.0}, mats)
    assert result.status == "ok"
    amounts = {r["name"]: r["amount"] for r in result.recipe}
    assert abs(sum(amounts.values()) - 100.0) < 1e-6
    assert 20 - 1e-6 <= amounts["A"] <= 50 + 1e-6
    # 目标 SiO2=90 时无约束最优为 A=80，超出上界 50，解应被压到上界
    result2 = solve_recipe({"SiO2": 90.0, "Al2O3": 10.0}, mats)
    amounts2 = {r["name"]: r["amount"] for r in result2.recipe}
    assert abs(amounts2["A"] - 50.0) < 1e-4


if __name__ == "__main__":
    for name, fn in sorted(list(globals().items())):
        if name.startswith("test_"):
            fn()
            print(f"PASS {name}")
    print("全部测试通过")

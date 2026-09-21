from __future__ import annotations

from pydantic import BaseModel, Field


class MaterialIn(BaseModel):
    name: str = Field(..., min_length=1)
    oxides: dict[str, float] = Field(default_factory=dict)
    min: float = 0.0
    max: float = 100.0
    disabled: bool = False


class SolveRequest(BaseModel):
    target: dict[str, float]
    materials: list[MaterialIn]


class RecipeItem(BaseModel):
    name: str
    amount: float
    min: float
    max: float
    disabled: bool


class SolveResponse(BaseModel):
    status: str  # "ok" | "conflict" | "error"
    conflicts: list[str] = []
    notes: list[str] = []
    oxides: list[str] = []
    recipe: list[RecipeItem] = []
    target: dict[str, float] = {}
    computed: dict[str, float] = {}
    deviation: dict[str, float] = {}
    residual: float | None = None
    exact: bool = False

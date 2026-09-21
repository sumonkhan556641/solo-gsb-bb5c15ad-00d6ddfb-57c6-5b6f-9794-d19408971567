from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import SolveRequest, SolveResponse
from .sample_data import SAMPLE
from .solver import Material, solve_recipe

app = FastAPI(title="釉料配方反推 API", version="1.0.0")

# 开发期前端（vite dev server）与生产 nginx 代理都会访问，放开 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/sample")
def get_sample() -> dict:
    """返回示例目标与原料数据。"""
    return SAMPLE


@app.post("/api/solve", response_model=SolveResponse)
def solve(req: SolveRequest) -> SolveResponse:
    materials = [
        Material(
            name=m.name,
            oxides=m.oxides,
            min=m.min,
            max=m.max,
            disabled=m.disabled,
        )
        for m in req.materials
    ]
    result = solve_recipe(req.target, materials)
    return SolveResponse(
        status=result.status,
        conflicts=result.conflicts,
        notes=result.notes,
        oxides=result.oxides,
        recipe=result.recipe,
        target=result.target,
        computed=result.computed,
        deviation=result.deviation,
        residual=result.residual,
        exact=result.exact,
    )

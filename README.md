# 釉料配方反推（Glaze Recipe Solver）

录入目标氧化物比例与各原料的氧化物组成，求解**总量为 100、用量非负且满足最小/最大边界**的最小残差釉料配方。

- 前端：React + TypeScript（Vite），nginx 托管并反向代理 API
- 后端：FastAPI + SciPy（SLSQP / trust-constr 有界最小二乘）
- 边界相互矛盾时明确指出冲突；目标不可精确达到时返回最近配方及逐项偏差
- 内置示例数据、结果对照表、配方 JSON 导入 / 导出

## 快速开始（Docker）

```bash
docker compose up --build
```

一条命令即可完成镜像构建（依赖在镜像内安装）并启动全部服务。

| 服务 | 地址 | 说明 |
| --- | --- | --- |
| 前端 Web UI | http://localhost:8080 | 浏览器访问入口 |
| 后端 API | http://localhost:8000 | 容器端口 8000 映射到宿主机 8000 |
| API 交互文档 | http://localhost:8000/docs | FastAPI 自动生成的 Swagger UI |

停止：`docker compose down`。

## 使用说明

1. **目标氧化物比例**：逐项录入各氧化物的目标质量分数（%）。总和不为 100 时系统自动归一化。
2. **原料组成与约束**：每种原料录入其氧化物组成（%），可设置：
   - **启用/禁用**：禁用后该原料用量固定为 0；
   - **最小用量 / 最大用量**：以总配方 100 份计。
3. 点击 **求解配方**：
   - 边界本身矛盾（如最小用量之和 > 100、某原料 min > max）时，逐条列出冲突；
   - 目标可精确达到时给出精确配方；
   - 目标不可精确达到时，返回残差最小的最近配方，并在对照表中列出每种氧化物的目标值、计算值与逐项偏差。
4. **JSON 导入 / 导出**：可将当前目标与原料数据导出为 JSON 文件，或从文件 / 文本粘贴导入。

### JSON 格式

```json
{
  "target": { "SiO2": 64.624, "Al2O3": 10.43 },
  "materials": [
    {
      "name": "钾长石",
      "oxides": { "SiO2": 66.0, "Al2O3": 18.5, "K2O": 11.0, "Na2O": 3.0, "CaO": 1.5 },
      "min": 0,
      "max": 100,
      "disabled": false
    }
  ]
}
```

## API

- `GET /api/sample` — 示例数据（中温透明釉）
- `POST /api/solve` — 求解，请求体即上述 JSON 格式；响应包含：
  - `status`：`ok` / `conflict` / `error`
  - `conflicts`：边界冲突描述列表
  - `recipe`：各原料用量（总量 100）
  - `target` / `computed` / `deviation`：各氧化物的目标值、计算值与偏差（百分点）
  - `residual` / `exact`：总残差与是否精确达到

## 数学模型

设原料用量为 x（Σx = 100，lb ≤ x ≤ ub），原料氧化物分数矩阵为 M，目标为 b，
求解 min ‖Mx − b‖²。等式与边界约束由 SciPy 的 SLSQP 处理（失败时回退 trust-constr）。

## 本地开发（不用 Docker）

```bash
# 后端（Python 3.11+）
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端（Node 20+），开发服务器已配置 /api 代理到 8000 端口
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## 测试

```bash
cd backend
python3 tests/test_solver.py    # 求解器单元测试（精确解 / 冲突检测 / 边界生效 / 最近配方）
```

## 目录结构

```
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py          # FastAPI 入口
│   │   ├── solver.py        # 最小残差求解器（SciPy）
│   │   ├── models.py        # Pydantic 模型
│   │   └── sample_data.py   # 示例数据
│   └── tests/test_solver.py
└── frontend/
    ├── Dockerfile           # 构建静态文件后用 nginx 托管并代理 /api
    ├── nginx.conf
    └── src/                 # React + TypeScript 源码
```

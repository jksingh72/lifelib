# Lifelib Web Platform Specification (React + FastAPI)

A comprehensive architectural and functional specification for building a modern web-based graphical user interface and AI-powered Actuarial Copilot on top of **`lifelib`** and **`modelx`**.

---

## 1. Executive Summary & Objective

The **Lifelib Web Platform** extends `lifelib` from an interactive Python/Jupyter-based tool into a collaborative, visual actuarial platform. 

### Key Capabilities:
- **Interactive Policy Explorer:** Search, inspect, and filter policy portfolios across all lifelib templates (`simplelife`, `basiclife`, `uslib`, `jplib`, etc.).
- **Live Cash Flow Visualizations:** Zoomable stacked bar charts (Premiums vs. Claims vs. Expenses) and 50-year tabular projection statements.
- **Real-Time Sensitivity & Stress Testing:** Interactive sliders for interest rate shocks ($\pm 200\text{ bps}$), mortality multipliers ($80\% - 150\%$), and lapse rate adjustments with live recalculated Present Values ($PV$).
- **Visual Space & Formula Inspector:** Interactive tree view of `modelx` spaces (`Projection`, `Policy`, `LifeTable`), displaying raw formulas, LaTeX mathematical notation, and dependency DAGs.
- **AI Actuarial Copilot:** Integrated conversational assistant with direct tool-calling access to query model spaces, explain actuarial formulas, and run scenario stress tests.

---

## 2. High-Level Architecture

The platform follows a decoupled client-server architecture:
- **Frontend (Client):** Single Page Application (SPA) built with **React**, **TypeScript**, and **Tailwind CSS**.
- **Backend (Server):** Asynchronous API service built with **Python**, **FastAPI**, and **Uvicorn**, interfacing directly with the in-memory **`modelx`** calculation engine.
- **AI Agent Engine:** Tool-calling layer connecting LLMs (Gemini / OpenAI / Anthropic / Local Ollama) to `modelx` query functions.

```mermaid
flowchart TB
    subgraph Browser["User Browser (Chrome / Edge / Firefox)"]
        UI["Actuarial Workspace\n(Policy Selector, DataGrid, Sliders)"]
        Charts["Interactive Visualizations\n(Recharts / Plotly.js)"]
        Chat["AI Copilot Drawer\n(Streaming Markdown + Tool Output Cards)"]
    end

    subgraph BackendServer["FastAPI Backend (localhost:8000)"]
        Router["API Routers\n(/api/models, /api/projections, /api/chat)"]
        ModelMgr["Modelx Session Manager\n(In-memory model caching & cloning)"]
        AIEngine["AI Agent Engine\n(Function Calling Dispatcher)"]
    end

    subgraph CoreEngine["Lifelib Actuarial Engine"]
        MX["modelx Runtime\n(Dynamic Spaces, Cells, Commutation Functions)"]
        Templates["Lifelib Libraries\n(simplelife, basiclife, uslib, etc.)"]
        LLM["LLM Provider\n(Gemini / OpenAI API / Local Ollama)"]
    end

    UI <-->|REST API (JSON)| Router
    Charts <-->|REST API (JSON)| Router
    Chat <-->|Server-Sent Events (SSE)| Router

    Router --> ModelMgr
    Router --> AIEngine
    ModelMgr --> MX
    MX --> Templates
    AIEngine <-->|Tool Execution| ModelMgr
    AIEngine <-->|Streaming Chat & Tools| LLM
```

---

## 3. Directory & Repository Layout

The web application is housed under a top-level `web/` directory in the repository:

```
lifelib/
├── web/
│   ├── backend/                      # Python FastAPI Service
│   │   ├── app/
│   │   │   ├── main.py               # FastAPI entry point & CORS configuration
│   │   │   ├── config.py             # Settings (ports, host, AI API keys)
│   │   │   ├── models/               # Pydantic Schemas
│   │   │   │   ├── policy.py         # Policy data schemas
│   │   │   │   ├── cashflow.py       # Cashflow statement schemas
│   │   │   │   └── chat.py           # Chat request/response schemas
│   │   │   ├── services/             # Actuarial & Modelx Wrappers
│   │   │   │   ├── model_service.py  # Model lifecycle (read_model, spaces, cells)
│   │   │   │   ├── scenario_service.py # Shocks & sensitivity engine
│   │   │   │   └── ai_service.py     # Tool-calling agent with LLM SDK
│   │   │   └── routes/               # API Endpoints
│   │   │       ├── models.py         # Templates & model loading
│   │   │       ├── projections.py    # Cashflow data & KPIs
│   │   │       ├── inspector.py      # Space tree & formula definitions
│   │   │       └── chat.py           # Streaming chat endpoint (SSE)
│   │   ├── requirements.txt          # fastapi, uvicorn, pydantic, google-genai/openai
│   │   └── run.py                    # Server launch script
│   │
│   └── frontend/                     # React Single Page Application (SPA)
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── src/
│       │   ├── api/                  # Axios/fetch API clients
│       │   ├── state/                # Zustand store (active model, policy, shocks)
│       │   ├── types/                # TypeScript interfaces
│       │   ├── components/
│       │   │   ├── layout/           # AppShell, Navbar, Sidebar
│       │   │   ├── dashboard/        # KPI Cards (PV, Gross Premium, Face Amount)
│       │   │   ├── charts/           # Stacked Cash Flow Bar Chart, Line Charts
│       │   │   ├── datagrid/         # 50-Year Projection Table with CSV Export
│       │   │   ├── scenarios/        # Real-time Shock Sliders (Interest, Mortality)
│       │   │   ├── inspector/        # Space Tree Navigator & LaTeX Formula View
│       │   │   └── chat/             # Streaming AI Copilot Drawer
│       │   ├── App.tsx
│       │   └── main.tsx
```

---

## 4. Backend API Specification

### 4.1 Model Lifecycle Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/templates` | List all available library templates (`simplelife`, `basiclife`, `uslib`, etc.). |
| `POST` | `/api/models/load` | Load a template or saved model into active memory. |
| `GET` | `/api/models/active` | Get metadata about the currently active model (name, spaces, policy count). |

#### Payload: `POST /api/models/load`
```json
{
  "template": "simplelife",
  "project_path": "my_project"
}
```

---

### 4.2 Policy & Projection Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/policies` | Return list of all model points/policies with basic attributes (ID, Product, Age, Sex, Sum Assured). |
| `GET` | `/api/projections/{policy_id}` | Return summary KPIs (Gross Premium, Net Premium, Surrender Charge, PV of Net CF). |
| `GET` | `/api/projections/{policy_id}/cashflows` | Return annual vectors for all cash flow line items (default 50 years). |
| `POST` | `/api/projections/{policy_id}/sensitivity` | Run on-the-fly interest rate, mortality, or lapse shocks and return comparison. |

#### Response: `GET /api/projections/{policy_id}/cashflows?max_t=50`
```json
{
  "policy_id": 171,
  "pv_net_cf": 24850.32,
  "years": [0, 1, 2, 3],
  "series": {
    "PremIncome": [1280.50, 1280.50, 1280.50, 1280.50],
    "BenefitDeath": [110.20, 115.40, 122.10, 130.50],
    "BenefitSurr": [0.0, 50.30, 85.00, 120.40],
    "BenefitMaturity": [0.0, 0.0, 0.0, 0.0],
    "ExpsTotal": [1800.00, 150.00, 150.00, 150.00],
    "NetInsurCF": [-629.70, 964.80, 923.40, 879.60]
  }
}
```

#### Payload: `POST /api/projections/{policy_id}/sensitivity`
```json
{
  "interest_shock_bps": 50,
  "mortality_multiplier": 1.10,
  "lapse_shock": -0.10
}
```

---

### 4.3 Space & Formula Inspector Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inspector/spaces` | Return full hierarchical tree of spaces (`Input`, `Projection`, `Policy`, `LifeTable`). |
| `GET` | `/api/inspector/cells` | Return all cells inside a selected space with current evaluated values. |
| `GET` | `/api/inspector/formula` | Return the Python formula code, docstring, and upstream dependencies for a cell. |

---

### 4.4 AI Actuarial Copilot (Streaming SSE)
- **Endpoint:** `POST /api/chat`
- **Protocol:** Server-Sent Events (`text/event-stream`)
- **Payload:**
```json
{
  "messages": [
    { "role": "user", "content": "Explain why cash flow is negative in year 0 for policy 171" }
  ],
  "context": {
    "model": "simplelife",
    "active_policy_id": 171
  }
}
```

---

## 5. AI Copilot Tooling (Function Calling)

The AI assistant has direct programmatic access to inspect the `modelx` calculation engine through 5 structured tools:

1. **`get_policy_details(policy_id: int)`**
   - *Description:* Retrieve insured age, gender, sum assured, policy term, and product type (`TERM`, `WL`, `ENDW`).
2. **`get_cashflows(policy_id: int, max_t: int)`**
   - *Description:* Return the annual cash flow statement (`PremIncome`, `BenefitDeath`, `BenefitSurr`, `ExpsTotal`, `NetInsurCF`).
3. **`explain_actuarial_formula(space_name: str, cell_name: str)`**
   - *Description:* Inspect the formula definition, AST, and docstring of any cell (e.g., `Policy.GrossPremRate`).
4. **`simulate_shock(policy_id: int, interest_bps: float, mortality_mult: float)`**
   - *Description:* Run an on-the-fly stress test and return the delta in Present Value ($\Delta \text{PV}$).
5. **`list_available_models()`**
   - *Description:* List active and available templates in the repository.

---

## 6. Frontend UI / UX Specification

### Visual Layout Grid

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo] Lifelib Platform  │ Library: [ simplelife ▾ ]  │ Policy: [ #171 (Whole Life) ▾ ]│
├───────────────┬────────────────────────────────────────────────────────┬───────────────┤
│ SPACES        │  KPIs: [ PV Net CF: $24,850 ] [ Gross Prem: $1,280 ]   │ AI COPILOT    │
│ ▾ model       ├────────────────────────────────────────────────────────┤ (Collapsible) │
│   ▸ Input     │  CASHFLOW PROJECTION (Years 0 to 50)                   │               │
│   ▾ Projection│  ┌──────────────────────────────────────────────────┐  │ User:         │
│     ▸ Policy  │  │ [Stacked Bar: Inflows vs Outflows]               │  │ "Why is       │
│     ▸ LifeTbl │  │ [Red Line: Net Cash Flow]                        │  │  cashflow     │
│   ▸ Economic  │  └──────────────────────────────────────────────────┘  │  negative     │
│               ├────────────────────────────────────────────────────────┤  in Y0?"      │
│ SENSITIVITY   │  50-YEAR DATA GRID                                     │               │
│ Rate Shock:   │  t  | Prem   | Claims | Surr | Exps  | Net CF | Reserve│ AI:           │
│ [──●──] +50bp │  0  | 1280.5 | 110.2  | 0.0  | 1800  | -629.7 | 450.0  │ "Heavy        │
│ Mort Shock:   │  1  | 1280.5 | 115.4  | 50.3 | 150   | +964.8 | 920.0  │  acquisition  │
│ [────●] +10%  │  ...| ...    | ...    | ...  | ...   | ...    | ...    │  expenses."   │
└───────────────┴────────────────────────────────────────────────────────┴───────────────┘
```

### Key Frontend Components:
- **`AppShell`:** Top bar with template selector, connection status indicator, and policy picker.
- **`CashflowChart`:** Recharts-based stacked bar chart:
  - Bars above zero: Premium Income.
  - Bars below zero: Death claims, surrender claims, expenses.
  - Line overlay: Net Cash Flow.
- **`ProjectionGrid`:** Virtualized 50-year data table with sorting, column filtering, and a one-click **"Export to Excel"** button.
- **`SensitivityPanel`:** Sliders for interest rate shocks, mortality multipliers, and lapse shocks that trigger real-time recalculations.
- **`FormulaInspectorModal`:** Modal displaying the mathematical LaTeX representation of selected cells along with formula dependencies.
- **`ChatDrawer`:** Right-hand streaming chat interface with markdown formatting, code highlighting, and interactive tool cards.

---

## 7. Execution & Development Workflow (WSL + Windows)

Because development occurs in **WSL**, the workflow is optimized for seamless cross-environment operation:

### Step 1: Start Backend (in WSL terminal)
```bash
cd /home/jksingh/lifelib
source venv_lifelib/bin/activate
cd web/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Runs on `http://localhost:8000`*.

### Step 2: Start Frontend (in WSL terminal)
```bash
cd /home/jksingh/lifelib/web/frontend
npm run dev -- --host
```
*Runs on `http://localhost:5173`*.

### Step 3: Open in Windows
Open your browser on Windows (Chrome, Edge) and navigate to:
```
http://localhost:5173
```
Windows automatically routes `localhost` requests into the WSL development environment.

---

## 8. Implementation Milestones

- **Milestone 1 (Backend Core):** Create FastAPI project, model lifecycle manager (`read_model`), and cash flow extraction endpoints.
- **Milestone 2 (Frontend Foundation):** Setup Vite + React + Tailwind, KPI cards, and Recharts stacked cash flow visualization.
- **Milestone 3 (Interactive DataGrid & Sliders):** 50-year projection table and real-time sensitivity shock sliders.
- **Milestone 4 (Space & Formula Inspector):** Space tree navigator and LaTeX formula cards.
- **Milestone 5 (AI Actuarial Copilot):** Streaming SSE endpoint, LLM tool calling, and chat drawer.


# Lifelib Quick Start & Overview Guide

## 1. What is `lifelib`?

**lifelib** (`v0.17.2`) is an open-source collection of **life actuarial models written in Python**. Rather than a standalone web server or GUI application, `lifelib` is a **Python library and project template generator** (powered by [`modelx`](http://docs.modelx.io), `pandas`, `numpy`, and `openpyxl`).

It is designed for:
- **Pricing & Profit Testing**
- **Cashflow Projections & Valuation** (IFRS 17, Solvency II, LDTI, etc.)
- **Asset-Liability Modeling (ALM) & Economic Scenario Generation**
- **Actuarial Modernization** (replacing complex Excel spreadsheets with version-controlled, testable Python models)

### Architecture & Key Components
- [`lifelib/__init__.py`](file:///home/jksingh/lifelib/lifelib/__init__.py): Exposes `lifelib.create()`, the primary API for scaffolding actuarial model projects.
- [`lifelib/commands/create.py`](file:///home/jksingh/lifelib/lifelib/commands/create.py): Provides the `lifelib-create` CLI command.
- [`lifelib/libraries/`](file:///home/jksingh/lifelib/lifelib/libraries): Contains **20 pre-built actuarial model libraries** (templates), including:
  - **Core Life Models**: `basiclife` (default), `simplelife`, `annuallife`, `appliedlife`, `nestedlife`, `fastlife`, `savings`
  - **Country-Specific Libraries**: `uslib` (US), `uklib` (UK), `jplib` (Japan), `frlib` (France), `delib` (Germany), `krlib` (Korea)
  - **Regulatory & Economic Models**: `ifrs17a`, `ifrs17sim`, `solvency2`, `smithwilson`, `economic`, `economic_curves`, `assets`, `cluster`
- [`Makefile`](file:///home/jksingh/lifelib/Makefile): Automates virtual environment creation (`venv_lifelib`), dependency installation, testing (`pytest`), and linting.

---

## 2. How to Set Up and Start `lifelib` Quickly

### Step 1: Initialize the Environment
From the project root (`/home/jksingh/lifelib`), use the included [`Makefile`](file:///home/jksingh/lifelib/Makefile) to create a virtual environment (`venv_lifelib`) and install `lifelib` along with all runtime and development dependencies:

```bash
cd /home/jksingh/lifelib
make init
```

*(Note: If you only need runtime dependencies without test/linting tools, you can run `make install` instead.)*

### Step 2: Activate the Virtual Environment
```bash
source venv_lifelib/bin/activate
```

---

## 3. How to Use `lifelib` (3 Ways to Run Models)

Because `lifelib` is a library of actuarial models, "starting" the application means **creating a working copy of a model library** and running its projections via CLI, Python/IPython, or Jupyter Notebooks.

### Way 1: Create & Run a Model Project via CLI & Python (Fastest)
1. **Scaffold a new project folder** (e.g., `my_project`) from the default `basiclife` template using the CLI:
   ```bash
   lifelib-create --template basiclife ./my_project
   ```
   *(Or omit `--template basiclife` since `basiclife` is the default).*

2. **Run a model calculation in Python**:
   ```bash
   cd my_project
   python -c "import modelx as mx; m = mx.read_model('BasicTerm_S'); print(m.Projection[1].pv_net_cf())"
   ```
   Or run the standalone (non-modelx) sample script included in `basiclife`:
   ```bash
   cd /home/jksingh/lifelib/lifelib/libraries/basiclife
   python -c "from BasicTerm_SC_nomx import BasicTerm_SC; print(BasicTerm_SC.Projection[1].pv_net_cf())"
   ```

### Way 2: Interactive Python / IPython Session
You can create and inspect models directly in Python:

```python
import lifelib
import modelx as mx

# 1. Copy the 'basiclife' library into a new './mylife' directory
lifelib.create("basiclife", "mylife")

# 2. Load a model from the newly created directory
model = mx.read_model("mylife/BasicTerm_S")

# 3. Access spaces and calculate present value of net cashflows for Policy #1
print("Net Cashflow PV:", model.Projection[1].pv_net_cf())

# 4. Output results as a pandas DataFrame
print(model.Projection[1].result_cf)
```

### Way 3: Run Interactive Jupyter Notebooks
Every library in `lifelib/libraries/` includes `.ipynb` Jupyter notebooks that demonstrate cashflow projections, premium table generation, and plotting.

```bash
# Install jupyter in your activated venv if not already installed
pip install notebook

# Navigate to your created project or directly to a library folder
cd /home/jksingh/lifelib/lifelib/libraries/basiclife
jupyter notebook
```

---

## 4. Running Tests & Verification

To verify that the installation and all actuarial models are working properly, run the test suite from the project root:

```bash
# Run full test suite with coverage
make test

# Run tests in parallel (faster)
make test-fast

# Run tests for a specific library (e.g., basiclife)
venv_lifelib/bin/pytest lifelib/tests/libraries/test_basiclife.py
```

---

## 5. Useful Makefile Commands Summary

| Command | Description |
| :--- | :--- |
| `make help` | Show all available `Makefile` commands |
| `make init` | Create `venv_lifelib` and install `lifelib` in editable dev mode |
| `make install` | Create `venv_lifelib` and install runtime dependencies only |
| `make test` | Run all unit and model tests using `pytest` |
| `make test-fast` | Run tests in parallel across CPU cores (`pytest -n auto`) |
| `make lint` | Check code quality with `flake8` |
| `make format` | Auto-format code with `black` and `isort` |
| `make clean` | Clean build artifacts and caches |
| `make clean-all` | Clean everything including removing `venv_lifelib` |


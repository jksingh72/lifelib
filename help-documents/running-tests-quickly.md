# Testing Strategy & Running Fast Tests in `lifelib`

## 1. Why `make test` Takes So Long

When you run `make test`, it executes:
```bash
venv_lifelib/bin/pytest -v --cov=lifelib --cov-report=term-missing
```

This is a **massive end-to-end actuarial suite** across **75 test files** for four main reasons:
1. **Sequential Execution**: `make test` runs on a single CPU core one test at a time.
2. **Coverage Overhead (`--cov=lifelib`)**: Tracking line-by-line Python execution across thousands of dynamically evaluated `modelx` formula cells adds significant runtime overhead.
3. **Full Multi-Country Actuarial Projections**: It loads and runs monthly/annual cashflow projections (up to 720 months per policy) across **60+ insurance products** in 6 country libraries:
   - **US (`uslib`)**: 12 products (Term, Whole Life, UL, IUL, VUL, GUL, VA, RILA, FIA, FDA, DIA, SPIA)
   - **UK (`uklib`)**: 7 products (Term, Whole of Life, Income Protection, Critical Illness, Pension Annuity, Unit-Linked Bond, With-Profits)
   - **Japan (`jplib`)**: 9 products (Term, Whole Life, FX Whole Life, Endowment, Medical, Cancer, Nursing Care, Income Guarantee, Individual Annuity)
   - **Germany (`delib`)**: 10 products (Risikoleben, Kapitalleben, Klassische Rente, Fondsgebundene Rente, Riester, Basisrente, Sofortrente, BU, Pflege, Indexpolice)
   - **France (`frlib`)**: 8 products (Temporaire Décès, Assurance Vie Euro/UC, Eurocroissance, PER, Rente Viagère, Emprunteur, Dépendance, Obsèques)
   - **Korea (`krlib`)**: 10 products (Term, Whole Life, Variable Annuity, Pension Savings, Immediate Annuity, Cancer, CI, Indemnity Medical, LTC, Child)
4. **`nomx` Export & Verification (`test_export.py`)**: For every single registered model in the 6 country libraries, `test_export.py` exports the `modelx` model to a standalone pure-Python package, inspects its symbol table, runs full projections in both `modelx` and pure Python, and compares every DataFrame cell-by-cell.

---

## 2. How to Run Tests Quickly

Instead of running `make test`, use one of the targeted or parallel commands below depending on what you need:

### Option A: Run in Parallel Across All CPU Cores (`make test-fast`)
Uses `pytest-xdist` (`-n auto`) and skips coverage tracking, cutting runtime down dramatically:
```bash
make test-fast
```

### Option B: Quick Smoke Test (Seconds)
If you just want to verify your environment and `lifelib` installation work, run the CLI command test or a single lightweight library test:
```bash
# Test CLI project creation (< 2 seconds)
venv_lifelib/bin/pytest lifelib/tests/commands/test_create.py -v

# Test simplelife model (< 5 seconds)
venv_lifelib/bin/pytest lifelib/tests/libraries/test_simplelife.py -v
```

### Option C: Test Only One Country Library or Product
If you are working on a specific library or product, point `pytest` directly to that folder or file:
```bash
# Run only US Term Life tests
venv_lifelib/bin/pytest lifelib/libraries/uslib/tests/test_term_life_us.py -v

# Run all US library tests in parallel
venv_lifelib/bin/pytest lifelib/libraries/uslib/tests -n auto

# Run only core library tests (simplelife, nestedlife, fastlife, solvency2, tradlife)
venv_lifelib/bin/pytest lifelib/tests/libraries -n auto
```

### Option D: Skip the Heavy `test_export.py` Suite
`lifelib/tests/export/test_export.py` exports and double-runs every model across all 6 country libraries. To skip it during local runs:
```bash
venv_lifelib/bin/pytest -n auto --ignore=lifelib/tests/export/test_export.py
```

### Option E: Run Only Tests Matching a Keyword (`-k`)
```bash
# Run only golden worked-example tests for a product
venv_lifelib/bin/pytest lifelib/libraries/uslib/tests/test_term_life_us.py -k "test_worked_example"
```

---

## 3. Summary Cheat Sheet

| Goal | Command | Speed |
| :--- | :--- | :--- |
| **Verify install / CLI works** | `venv_lifelib/bin/pytest lifelib/tests/commands/test_create.py` | ~1–2 sec |
| **Test a single model** | `venv_lifelib/bin/pytest lifelib/tests/libraries/test_simplelife.py` | ~3–5 sec |
| **Test one country product** | `venv_lifelib/bin/pytest lifelib/libraries/uslib/tests/test_term_life_us.py` | ~5–10 sec |
| **Test one country library (parallel)** | `venv_lifelib/bin/pytest lifelib/libraries/uslib/tests -n auto` | ~15–30 sec |
| **Full suite without export tests (parallel)** | `venv_lifelib/bin/pytest -n auto --ignore=lifelib/tests/export` | Fast |
| **Full suite in parallel** | `make test-fast` | Medium |
| **Full suite + coverage (single-core)** | `make test` | Very Slow |


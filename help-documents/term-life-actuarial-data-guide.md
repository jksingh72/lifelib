# Guide to the U.S. Term Life Model (`Term_US_S`) & Its Input Tables

## 1. Overview

In [`lifelib`](file:///home/jksingh/lifelib), the reference liability cash flow model for U.S. level premium term life insurance is located in:
`lifelib/libraries/uslib/products/term_life/`

The model is built on [`modelx`](http://docs.modelx.io) and projects monthly gross liability cash flows for single-life, level premium term life insurance products (such as a 10-year level term policy, **T10**).

### Key Product Mechanics
* **Level Period (Years 1–10):** Guaranteed fixed level premium.
* **Post-Level Period (Years 11+):** Automatic renewal on an **Annual Renewable Term (ART)** basis with steeply increasing premiums ("Jump-to-ART").
* **Shock Lapse:** A massive customer surrender/cancellation spike at month 120 (the end of the level period) driven by the premium jump.
* **Mortality Deterioration:** Remaining policyholders post-level term experience worsened mortality due to anti-selection (healthy lives lapse; unhealthy lives retain coverage).
* **Expiry:** Attained age 95 with no cash surrender value.

---

## 2. Detailed Breakdown of the 5 Input Tables

The model separates **actuarial calculation logic** (in [`Term_US_S/`](file:///home/jksingh/lifelib/lifelib/libraries/uslib/products/term_life/Term_US_S)) from **input data** (in the parent folder). All input tables are plain CSV files that are read once into memory by the `Data` space:

```
products/term_life/
├── model_point_table.csv    # Policyholder census / portfolio
├── mort_table.csv           # Baseline mortality rates
├── class_factor_table.csv   # Underwriting risk class multipliers
├── premium_rates.csv        # Contractual premium rates schedule
├── shock_lapse_table.csv    # Price jump vs. shock lapse lookup
├── run.py                   # Runner script
└── Term_US_S/               # modelx computation engine
    ├── _system.json
    ├── __init__.py          # Model definition and manifest
    ├── Data/                # Data loading space
    └── Projection/          # Formula and projection space
```

---

### File 1: [`model_point_table.csv`](file:///home/jksingh/lifelib/lifelib/libraries/uslib/products/term_life/model_point_table.csv) — The Policyholder Census

Defines the individual policy contracts (model points) to be projected:

```csv
point_id,policy_id,age_at_entry,sex,rate_class,plan,sum_assured,premium_mode,pols_if_init,duration_inforce,plt_mort_factor_override
1,TL-000001,35,M,StdNT,T10,100000.0,A,1.0,0,3.5
2,TL-000002,35,M,StdNT,T10,100000.0,A,1.0,0,
```

#### Field Explanations:
* **`point_id`**: Unique integer ID for each model point row (`1`, `2`, ...). In `modelx`, `Projection[point_id]` uses this key to run a **seriatim** (policy-by-policy) valuation.
* **`policy_id`**: Real-world contract / certificate number from the policy administration system (e.g. `TL-000001`).
* **`age_at_entry`**: Issue age of the insured (e.g. `35`). The projection clock starts at this age and runs until attained age 95.
* **`sex`**: Biological sex (`M` = Male, `F` = Female). Determines mortality and rate lookup.
* **`rate_class`**: Underwriting rating class (e.g. `StdNT` for Standard Non-Tobacco).
* **`plan`**: Product plan code (`T10` = 10-year level term).
* **`sum_assured`**: Face amount / death benefit payout in dollars (e.g. `$100,000.00`).
* **`premium_mode`**: Billing frequency: `A` (Annual), `S` (Semi-Annual), `Q` (Quarterly), `M` (Monthly).
* **`pols_if_init`**: Starting in-force policy count (typically `1.0` for seriatim valuation).
* **`duration_inforce`**: Completed policy duration at valuation date (0 for newly issued policies).
* **`plt_mort_factor_override`**: Optional manual override for post-level term mortality deterioration. If left blank, the model calculates it from the standard jump formula.

---

### File 2: [`mort_table.csv`](file:///home/jksingh/lifelib/lifelib/libraries/uslib/products/term_life/mort_table.csv) — Baseline Mortality Rates

Contains the base annual probability of death ($q_x$) indexed by attained age:

```csv
age,mort_rate,provenance
35,0.0008,worked example [std]
36,0.00085,worked example [std]
...
50,0.00282316,extension [std]
...
94,0.30000000,extension [std]
```

#### Field Explanations:
* **`age`**: Attained age of the insured (`age_at_entry + duration_years`).
* **`mort_rate`**: Annual probability of death ($q_x$). For example, `0.0008` means 8 out of 10,000 people die at age 35.
* **`provenance`**: Audit metadata indicating whether the rate came from a published specimen, standard table, or mathematical extrapolation.

---

### File 3: [`class_factor_table.csv`](file:///home/jksingh/lifelib/lifelib/libraries/uslib/products/term_life/class_factor_table.csv) — Underwriting Risk Multipliers

Scales the baseline mortality table based on medical underwriting and tobacco habits:

```csv
rate_class,factor
PPlusNT,0.8
PNT,0.9
StdNT,1.0
StdTob,1.75
```

#### Field Explanations:
* **`rate_class`**:
  * `PPlusNT` (Preferred Plus Non-Tobacco): Best health, 20% discount on mortality.
  * `PNT` (Preferred Non-Tobacco): Good health, 10% discount on mortality.
  * `StdNT` (Standard Non-Tobacco): Baseline reference risk (`1.0`).
  * `StdTob` (Standard Tobacco): Smoker, 75% higher mortality risk (`1.75`).
* **Calculation:**
  $$\text{Adjusted Annual Mortality}(t) = \text{mort\_table}[\text{attained\_age}] \times \text{class\_factor}[\text{rate\_class}]$$
  The monthly applied rate is then compounded:
  $$q^{(12)} = 1 - (1 - q)^{1/12}$$

---

### File 4: [`premium_rates.csv`](file:///home/jksingh/lifelib/lifelib/libraries/uslib/products/term_life/premium_rates.csv) — Contractual Premium Pricing Schedule

Specifies the guaranteed annual premium charged per policy by duration:

```csv
plan,sex,rate_class,band,policy_year,premium_pp,provenance
T10,M,StdNT,1,1,140.0,sourced
...
T10,M,StdNT,1,10,140.0,sourced
T10,M,StdNT,1,11,764.0,sourced
T10,M,StdNT,1,12,830.0,sourced
```

#### Field Explanations:
* **`band`**: Sum assured pricing band (e.g. Band 1: \$100k–\$249k; Band 2: \$250k–\$499k; etc.).
* **`policy_year`**: 1-based contractual year since issue.
* **`premium_pp`**: Annual premium per policy (includes base cost of insurance + policy fee).
  * **Years 1–10 (Level Period):** Constant at **`$140.00`**.
  * **Year 11 (ART Renewal):** Spikes to **`$764.00`** ($5.46\times$ jump).
  * **Year 12+:** Increases every single year to reflect aging.

---

### File 5: [`shock_lapse_table.csv`](file:///home/jksingh/lifelib/lifelib/libraries/uslib/products/term_life/shock_lapse_table.csv) — Post-Level Term Shock Lapse Lookup

Maps the premium increase ("jump ratio") at the end of the level period to policyholder cancellation rates:

```csv
,jump_lo,jump_hi,shock_lapse_rate
0,0.0,2.0,0.35
1,2.0,4.0,0.55
2,4.0,6.0,0.80
3,6.0,8.0,0.85
4,8.0,9990000000.0,0.90
```

#### Field Explanations:
* **`jump_lo` / `jump_hi`**: Bounds for the Jump Ratio:
  $$\text{Jump Ratio} = \frac{\text{Premium at Year 11}}{\text{Premium at Year 10}} = \frac{764}{140} = 5.457$$
* **`shock_lapse_rate`**: The fraction of in-force policyholders who immediately surrender/lapse at month 119/120.
  * Because $5.457$ falls between `4.0` and `6.0`, **80% of active policies lapse instantly**.

---

## 3. How the Tables Interact in the Projection

```
[ model_point_table.csv ]
  (Age 35, Male, StdNT, Plan T10, Sum Assured $100k)
           │
           ├───> [ mort_table.csv ] & [ class_factor_table.csv ]
           │       └──> Calculates Monthly Deaths & Death Benefits Paid
           │
           ├───> [ premium_rates.csv ]
           │       └──> Calculates Monthly/Annual Premiums Collected ($140/yr)
           │
           └───> Month 120 (End of Year 10):
                   └──> Compares Year 11 ($764) vs Year 10 ($140)
                   └──> Looks up [ shock_lapse_table.csv ] (Jump = 5.46x)
                   └──> 80% Shock Lapse immediately applied!
                   └──> Remaining 20% experience 3.5x Mortality Deterioration
```

---

## 4. How Actuaries Use This Model (3 Real-World Use Cases)

| Use Case | Actuarial Role | Files Adjusted | Primary Goal |
| :--- | :--- | :--- | :--- |
| **1. Product Pricing & Profit Testing** | Pricing Actuary | `premium_rates.csv` | Find premium scales that yield target Profit Margin / Internal Rate of Return (IRR). |
| **2. Quarterly Valuation & Reserving** | Valuation Actuary | `model_point_table.csv` | Run full company portfolio seriatim to compute statutory / GAAP / IFRS 17 liability reserves on the balance sheet. |
| **3. Shock Lapse & Capital Stress Testing** | Risk / ALM Actuary | `shock_lapse_table.csv`, `mort_table.csv` | Stress test company solvency against severe lapse cliffs and post-level term anti-selection. |

---

## 5. Running the Model

From the workspace root:

```bash
# Run model point 1 (anchor policy)
python lifelib/libraries/uslib/products/term_life/run.py 1

# Run model point 2 (formula-derived mortality deterioration)
python lifelib/libraries/uslib/products/term_life/run.py 2
```

Outputs:
* Model point summary (Age, Sex, Sum Assured, Jump Ratio, Shock Lapse rate).
* Month-by-month cash flows for Policy Year 1 ($t = 0 \dots 11$).
* Annual aggregated cash flows for Policy Years 1–12 (highlighting the Year 10 to Year 11 jump).


import logging
from pathlib import Path
from typing import Optional, Any
import pandas as pd
import modelx as mx

from app.config import BASE_DIR
from app.models.product_catalog import (
    ProductItem,
    ModelPointInfo,
    ProductProjectionResponse,
    OpenProductResponse,
    CompareResponse,
)

logger = logging.getLogger("lifelib.products")

COUNTRY_LABELS = {
    "uslib": ("United States", "US"),
    "uklib": ("United Kingdom", "UK"),
    "delib": ("Germany", "DE"),
    "frlib": ("France", "FR"),
    "jplib": ("Japan", "JP"),
    "krlib": ("South Korea", "KR"),
}

JURISDICTION_ORDER = {
    "uslib": 1,
    "uklib": 2,
    "delib": 3,
    "frlib": 4,
    "jplib": 5,
    "krlib": 6,
}

CATEGORY_MAP = {
    # Universal Life & Savings
    "universal_life": "Universal Life & Savings",
    "indexed_ul": "Universal Life & Savings",
    "variable_ul": "Universal Life & Savings",
    "guaranteed_ul": "Universal Life & Savings",
    "assurance_vie_uc": "Universal Life & Savings",
    "assurance_vie_euro": "Universal Life & Savings",
    "eurocroissance": "Universal Life & Savings",
    "fondsgebundene_rentenversicherung": "Universal Life & Savings",
    "unit_linked_bond": "Universal Life & Savings",
    "indexpolice": "Universal Life & Savings",
    "endowment": "Universal Life & Savings",
    "kapitallebensversicherung": "Universal Life & Savings",
    
    # Annuities
    "deferred_income_annuity": "Annuities",
    "fixed_deferred_annuity": "Annuities",
    "fixed_indexed_annuity": "Annuities",
    "immediate_annuity": "Annuities",
    "registered_index_linked_annuity": "Annuities",
    "variable_annuity": "Annuities",
    "pension_annuity": "Annuities",
    "individual_annuity": "Annuities",
    "sofortrente": "Annuities",
    "rente_viagere": "Annuities",
    "klassische_rentenversicherung": "Annuities",

    # Health & Critical Illness
    "cancer": "Health & Critical Illness",
    "medical": "Health & Critical Illness",
    "indemnity_medical": "Health & Critical Illness",
    "ci_insurance": "Health & Critical Illness",
    "critical_illness": "Health & Critical Illness",
    "income_protection": "Health & Critical Illness",
    "nursing_care": "Health & Critical Illness",
    "long_term_care": "Health & Critical Illness",
    "dependance": "Health & Critical Illness",
    "pflegerentenversicherung": "Health & Critical Illness",
    "berufsunfaehigkeit": "Health & Critical Illness",

    # Pensions
    "riester_rente": "Pensions",
    "basisrente": "Pensions",
    "per_assurance": "Pensions",
    "pension_savings": "Pensions",

    # Default: Life & Protection
}

PRODUCT_DISPLAY_NAMES = {
    "universal_life": "Universal Life (UL)",
    "indexed_ul": "Indexed Universal Life (IUL)",
    "variable_ul": "Variable Universal Life (VUL)",
    "guaranteed_ul": "Secondary Guarantee UL (ULSG)",
    "term_life": "Term Life Insurance",
    "whole_life": "Whole Life Insurance",
    "fixed_indexed_annuity": "Fixed Indexed Annuity (FIA)",
    "fixed_deferred_annuity": "Multi-Year Guarantee Annuity (MYGA)",
    "registered_index_linked_annuity": "Registered Index-Linked Annuity (RILA)",
    "variable_annuity": "Variable Annuity (VA)",
    "immediate_annuity": "Single Premium Immediate Annuity (SPIA)",
    "deferred_income_annuity": "Deferred Income Annuity (DIA)",
    "critical_illness": "Critical Illness Cover",
    "income_protection": "Income Protection",
    "pension_annuity": "Pension Annuity",
    "term_assurance": "Term Assurance",
    "unit_linked_bond": "Unit-Linked Investment Bond",
    "whole_of_life": "Whole of Life",
    "with_profits": "With-Profits Endowment",
    "cancer": "Cancer Protection Plan",
    "endowment": "Endowment Assurance",
    "fx_whole_life": "FX Foreign-Currency Whole Life",
    "income_guarantee": "Family Income Benefit",
    "individual_annuity": "Individual Fixed Annuity",
    "medical": "Comprehensive Medical Rider",
    "nursing_care": "Long-Term Care / Nursing",
    "child": "Child Education / Savings",
    "ci_insurance": "Major Illness / CI",
    "indemnity_medical": "Real-Loss Indemnity Medical",
    "long_term_care": "Long-Term Care Protection",
    "pension_savings": "Tax-Favored Pension Savings",
    "assurance_emprunteur": "Mortgage Credit Insurance (ADE)",
    "assurance_vie_euro": "Assurance-Vie Fonds Euro",
    "assurance_vie_uc": "Assurance-Vie Unités de Compte",
    "dependance": "Dépendance Autonomie",
    "eurocroissance": "Fonds Eurocroissance",
    "obseques": "Assurance Obsèques",
    "per_assurance": "Plan d'Épargne Retraite (PER)",
    "rente_viagere": "Rente Viagère",
    "temporaire_deces": "Temporaire Décès",
    "basisrente": "Rürup Basisrente",
    "berufsunfaehigkeit": "Berufsunfähigkeit (BU)",
    "fondsgebundene_rentenversicherung": "Fondsgebundene Rente (FRV)",
    "indexpolice": "Indexpolice",
    "kapitallebensversicherung": "Kapitallebensversicherung (KLV)",
    "klassische_rentenversicherung": "Klassische Rente (RV)",
    "pflegerentenversicherung": "Pflegerente",
    "riester_rente": "Riester-Rente",
    "risikolebensversicherung": "Risikolebensversicherung (RLV)",
    "sofortrente": "Sofortrente",
}


class LoadedEnvironment:
    def __init__(self, product_id: str, model_path: Path, model_obj: Any, has_av: bool):
        self.product_id = product_id
        self.model_path = model_path
        self.model = model_obj
        self.has_av = has_av


class ProductService:
    _instance: Optional["ProductService"] = None
    _catalog: list[ProductItem] = []
    _active_environments: dict[str, LoadedEnvironment] = {}

    @classmethod
    def get_instance(cls) -> "ProductService":
        if cls._instance is None:
            cls._instance = ProductService()
        return cls._instance

    def __init__(self):
        self.index_catalog()

    def index_catalog(self):
        """Discover and index all products in lifelib/libraries/*/products/*/run.py."""
        lib_dir = BASE_DIR / "lifelib" / "libraries"
        catalog = []

        for run_py in sorted(lib_dir.glob("*/products/*/run.py")):
            prod_dir = run_py.parent
            prod_name = prod_dir.name
            country_name = prod_dir.parent.parent.name

            # Find model subdirectory (contains _system.json)
            subdirs = [
                d for d in prod_dir.iterdir()
                if d.is_dir() and (d / "_system.json").exists()
            ]
            if not subdirs:
                continue

            # Detect whether product has account value logic (read run.py hint)
            run_text = run_py.read_text(encoding="utf-8", errors="ignore")
            has_av = "result_av" in run_text

            category = CATEGORY_MAP.get(prod_name, "Life & Protection")
            friendly_name = PRODUCT_DISPLAY_NAMES.get(
                prod_name, prod_name.replace("_", " ").title()
            )
            country_label, _ = COUNTRY_LABELS.get(
                country_name, (country_name.upper(), country_name[:2].upper())
            )

            product_id = f"{country_name}/{prod_name}"
            desc = f"{country_label} Actuarial Reference Model for {friendly_name}."

            catalog.append(
                ProductItem(
                    id=product_id,
                    name=friendly_name,
                    country=country_name,
                    country_label=country_label,
                    category=category,
                    description=desc,
                    has_account_value=has_av,
                    is_open=(product_id in self._active_environments),
                )
            )

        # Canonical order: US, UK, Germany, France, Japan, South Korea
        catalog.sort(
            key=lambda p: (
                JURISDICTION_ORDER.get(p.country, 99),
                p.category,
                p.name,
            )
        )
        self._catalog = catalog
        logger.info(f"Indexed {len(self._catalog)} production products in catalog.")

    def get_all_products(
        self, country: Optional[str] = None, category: Optional[str] = None
    ) -> list[ProductItem]:
        """Return catalog with active open status."""
        items = []
        for p in self._catalog:
            is_open = p.id in self._active_environments
            p_copy = p.model_copy(update={"is_open": is_open})
            if country and p.country != country:
                continue
            if category and p.category != category:
                continue
            items.append(p_copy)
        return items

    def _get_model_path_for_product(self, product_id: str) -> tuple[Path, bool]:
        """Locate the model directory and check account value availability."""
        country, prod = product_id.split("/")
        prod_dir = BASE_DIR / "lifelib" / "libraries" / country / "products" / prod
        subdirs = [
            d for d in prod_dir.iterdir()
            if d.is_dir() and (d / "_system.json").exists()
        ]
        if not subdirs:
            raise FileNotFoundError(f"No valid modelx model found in {prod_dir}")
        model_path = subdirs[0]

        run_py = prod_dir / "run.py"
        has_av = False
        if run_py.exists():
            has_av = "result_av" in run_py.read_text(encoding="utf-8", errors="ignore")

        return model_path, has_av

    def open_product(self, product_id: str) -> OpenProductResponse:
        """Initialize product environment and return model points with initial projection."""
        if product_id not in self._active_environments:
            model_path, has_av = self._get_model_path_for_product(product_id)
            logger.info(f"Initializing product environment [{product_id}] from {model_path}...")
            model_obj = mx.read_model(model_path)
            self._active_environments[product_id] = LoadedEnvironment(
                product_id=product_id,
                model_path=model_path,
                model_obj=model_obj,
                has_av=has_av,
            )

        env = self._active_environments[product_id]
        points = self._extract_model_points(env)
        initial_point_id = points[0].point_id if points else 1
        proj = self.get_projection(product_id, initial_point_id)

        product_meta = next((p for p in self.get_all_products() if p.id == product_id), None)
        if not product_meta:
            country, prod = product_id.split("/")
            product_meta = ProductItem(
                id=product_id,
                name=prod.replace("_", " ").title(),
                country=country,
                country_label=country.upper(),
                category="Life & Protection",
                description="",
                has_account_value=env.has_av,
                is_open=True,
            )

        return OpenProductResponse(
            product=product_meta.model_copy(update={"is_open": True}),
            model_points=points,
            projection=proj,
        )

    def close_product(self, product_id: str):
        """Close environment and free memory."""
        if product_id in self._active_environments:
            env = self._active_environments[product_id]
            try:
                env.model.close()
            except Exception as e:
                logger.warning(f"Error closing model {product_id}: {e}")
            del self._active_environments[product_id]
            logger.info(f"Closed product environment: {product_id}")

    def _build_point_description(self, mp_dict: dict, all_dicts: list[dict]) -> str:
        """Derive distinct human-readable actuarial tags for a model point."""
        tags = []

        # 1. Death benefit option (Option A Level vs Option B Increasing)
        db_opt = mp_dict.get("db_option")
        if db_opt:
            db_s = str(db_opt).upper()
            tags.append("Option A (Level DB)" if db_s == "A" else "Option B (Increasing DB)" if db_s == "B" else f"DB Opt {db_opt}")

        # 2. Critical illness / contract type
        contract_type = mp_dict.get("contract_type")
        if contract_type:
            c_s = str(contract_type).lower()
            tags.append(f"{str(contract_type).capitalize()} CI" if any(x in c_s for x in ["ci", "standalone", "accelerated"]) else str(contract_type).capitalize())

        # 3. Term / cashflow shape
        shape = mp_dict.get("shape")
        if shape:
            s_s = str(shape).lower()
            tags.append("Level Term" if s_s == "level" else "Decreasing Term" if s_s == "decreasing" else "Family Income Benefit (FIB)" if s_s == "fib" else str(shape).capitalize())

        # 4. Premium guarantee / basis
        prem_guar = mp_dict.get("premium_guarantee") or mp_dict.get("premium_basis")
        if prem_guar:
            tags.append(f"{str(prem_guar).capitalize()} Prem")

        # 5. Policy status / in-force duration / initial AV & loan
        dur_mth = mp_dict.get("duration_mth") or mp_dict.get("duration_inforce")
        dur_yr = mp_dict.get("duration_y")
        if dur_mth is not None and int(dur_mth) > 0:
            av_init = float(mp_dict.get("av_pp_init", 0.0) or 0.0)
            loan_init = float(mp_dict.get("loan_bal_init", 0.0) or 0.0)
            extras = []
            if av_init > 0:
                extras.append(f"AV ${int(av_init):,}")
            if loan_init > 0:
                extras.append(f"Loan ${int(loan_init):,}")
            extra_str = f" ({', '.join(extras)})" if extras else ""
            tags.append(f"In-Force Yr {int(dur_mth) // 12}{extra_str}")
        elif dur_yr is not None and int(dur_yr) > 0:
            tags.append(f"In-Force Yr {int(dur_yr)}")
        elif dur_mth is not None and int(dur_mth) == 0:
            tags.append("New Issue (Yr 0)")

        # 6. Premium payment term
        prem_term = mp_dict.get("prem_term")
        if prem_term is not None:
            tags.append(f"{prem_term}-Yr Pay" if int(prem_term) > 0 else "Life Pay")

        # 7. Low cash value / surrender charge features
        low_cv = mp_dict.get("low_cv")
        if low_cv is not None:
            rate = float(mp_dict.get("low_cv_rate", 0.7) or 0.7)
            tags.append(f"Low CV ({int(rate*100)}%)" if bool(low_cv) else "Standard CV")

        # 8. Smoking status
        smoker = mp_dict.get("smoker")
        if smoker:
            s_str = str(smoker).upper()
            tags.append("Non-Smoker" if s_str in ["N", "NS", "FALSE", "0"] else "Smoker" if s_str in ["S", "SM", "R", "TRUE", "1"] else f"Smoker: {smoker}")

        # 9. Product variants
        if mp_dict.get("variant_adb_2x"):
            tags.append("2x Accidental Death")
        if mp_dict.get("variant_paid_up"):
            tags.append("Paid-Up")

        # 10. Automatically include any key that varies across points
        if len(all_dicts) > 1:
            skip_keys = {
                "point_id", "policy_id", "age", "age_at_entry", "issue_age", "sex", "SexID",
                "sum_assured", "sa", "pols_if_init", "db_option", "contract_type", "shape",
                "premium_guarantee", "premium_basis", "duration_mth", "duration_inforce",
                "duration_y", "prem_term", "low_cv", "low_cv_rate", "smoker", "variant_adb_2x",
                "variant_paid_up", "av_pp_init", "loan_bal_init"
            }
            for k, v in mp_dict.items():
                if str(k).startswith("_") or k in skip_keys:
                    continue
                distinct_vals = {str(d.get(k)) for d in all_dicts}
                if len(distinct_vals) > 1 and v is not None and str(v) != "nan":
                    tags.append(f"{k}: {v}")

        return " • ".join(tags)

    def _extract_model_points(self, env: LoadedEnvironment) -> list[ModelPointInfo]:
        """Extract available policy / model points from the projection space."""
        model = env.model
        raw_list: list[tuple[int, dict]] = []

        # Typically model points are indexed 1..N
        for pt_id in range(1, 15):
            try:
                proj = model.Projection[pt_id]
                mp_series = proj.model_point()
                mp_dict = mp_series.to_dict() if hasattr(mp_series, "to_dict") else dict(mp_series)
                raw_list.append((pt_id, mp_dict))
            except Exception:
                # Reached end of available model points
                break

        if not raw_list:
            return [
                ModelPointInfo(
                    point_id=1,
                    policy_id="POINT-0001",
                    age=35,
                    sex="M",
                    sum_assured=100000.0,
                    label="Point #1: Policy POINT-0001 (Age 35, M)",
                    description="Standard Issue",
                    details={},
                )
            ]

        all_dicts = [d for _, d in raw_list]
        points: list[ModelPointInfo] = []

        for pt_id, mp_dict in raw_list:
            age = int(mp_dict.get("age_at_entry") or mp_dict.get("age") or mp_dict.get("issue_age") or 35)
            sex = str(mp_dict.get("sex") or mp_dict.get("SexID") or "M")
            sa = float(mp_dict.get("sum_assured") or mp_dict.get("sa") or 100000.0)
            pol_id = str(mp_dict.get("policy_id") or f"POL-{pt_id:04d}")

            desc = self._build_point_description(mp_dict, all_dicts)
            desc_part = f" • {desc}" if desc else ""
            label = f"Point #{pt_id}: {pol_id}{desc_part} (Age {age}, {sex})"

            points.append(
                ModelPointInfo(
                    point_id=pt_id,
                    policy_id=pol_id,
                    age=age,
                    sex=sex,
                    sum_assured=sa,
                    label=label,
                    description=desc,
                    details={k: str(v) if not isinstance(v, (int, float, bool)) else v for k, v in mp_dict.items()},
                )
            )

        return points

    def get_projection(self, product_id: str, point_id: int) -> ProductProjectionResponse:
        """Compute projection cash flows and account value roll-forward for a model point."""
        if product_id not in self._active_environments:
            self.open_product(product_id)

        env = self._active_environments[product_id]
        model = env.model
        proj = model.Projection[point_id]

        # Extract model point info
        try:
            mp_series = proj.model_point()
            mp_dict = mp_series.to_dict() if hasattr(mp_series, "to_dict") else dict(mp_series)
            mp_clean = {k: v for k, v in mp_dict.items() if isinstance(v, (int, float, str, bool))}
        except Exception:
            mp_clean = {"point_id": point_id}

        # Extract cash flows DataFrame
        cf_records = []
        kpis = {}
        try:
            cf_df = proj.result_cf()
            # Normalize column names to standard keys
            cols = {c: c.lower() for c in cf_df.columns}
            cf_df = cf_df.rename(columns=cols)

            # Cap projection to 60 steps for fast web rendering
            cf_sample = cf_df.head(60).copy()

            # Ensure 't' is present
            if "t" not in cf_sample.columns and cf_sample.index.name == "t":
                cf_sample["t"] = cf_sample.index
            elif "t" not in cf_sample.columns:
                cf_sample["t"] = range(len(cf_sample))

            cf_sample["year"] = cf_sample["t"].apply(lambda t_val: int(t_val // 12 + 1) if len(cf_df) > 50 else int(t_val + 1))

            # Fill missing standard columns
            for std_col in ["premiums", "claims_death", "expenses", "net_cf", "pols_if"]:
                if std_col not in cf_sample.columns:
                    cf_sample[std_col] = 0.0

            cf_records = cf_sample.round(2).to_dict(orient="records")

            # Calculate present value KPIs (using 3% discount rate)
            def safe_col(df, name):
                if name in df.columns:
                    col = df[name]
                    if isinstance(col, pd.DataFrame):
                        return col.iloc[:, 0]
                    return col
                return pd.Series(0.0, index=df.index)

            net_cf_series = safe_col(cf_sample, "net_cf")
            prem_series = safe_col(cf_sample, "premiums")
            claims_series = safe_col(cf_sample, "claims_death")
            if claims_series.sum() == 0:
                claims_series = safe_col(cf_sample, "claims")
            exps_series = safe_col(cf_sample, "expenses")

            total_net_cf = float(net_cf_series.sum())
            total_premiums = float(prem_series.sum())
            total_claims = float(claims_series.sum())
            total_expenses = float(exps_series.sum())

            disc_factors = [1.0 / ((1.0 + 0.03 / 12) ** (i + 0.5)) for i in range(len(cf_sample))]
            pv_net = float(sum(float(net_cf_series.iloc[i]) * disc_factors[i] for i in range(len(cf_sample))))
            pv_prem = float(sum(float(prem_series.iloc[i]) * disc_factors[i] for i in range(len(cf_sample))))

            margin = round((pv_net / pv_prem * 100.0), 2) if pv_prem != 0 else 0.0

            kpis = {
                "pv_net_cf": round(pv_net, 2),
                "pv_premiums": round(pv_prem, 2),
                "total_net_cf": round(total_net_cf, 2),
                "total_premiums": round(total_premiums, 2),
                "total_claims": round(total_claims, 2),
                "total_expenses": round(total_expenses, 2),
                "profit_margin_pct": margin,
            }
        except Exception as e:
            logger.error(f"Error computing result_cf for {product_id} point {point_id}: {e}")

        # Extract account values if available
        av_records = []
        if env.has_av and hasattr(proj, "result_av"):
            try:
                av_df = proj.result_av()
                av_sample = av_df.head(60).copy()
                if "t" not in av_sample.columns and av_sample.index.name == "t":
                    av_sample["t"] = av_sample.index
                elif "t" not in av_sample.columns:
                    av_sample["t"] = range(len(av_sample))
                av_records = av_sample.round(2).to_dict(orient="records")
            except Exception as e:
                logger.warning(f"Error reading result_av for {product_id}: {e}")

        prod_meta = next((p for p in self._catalog if p.id == product_id), None)
        prod_name = prod_meta.name if prod_meta else product_id
        country = prod_meta.country if prod_meta else product_id.split("/")[0]

        return ProductProjectionResponse(
            product_id=product_id,
            product_name=prod_name,
            country=country,
            point_id=point_id,
            model_point=mp_clean,
            has_account_value=len(av_records) > 0,
            cashflows=cf_records,
            account_values=av_records,
            kpis=kpis,
        )

    def get_space_tree(self, product_id: str) -> list[dict]:
        """Inspect modelx spaces and formulas for a specific product environment."""
        if product_id not in self._active_environments:
            self.open_product(product_id)
        env = self._active_environments[product_id]
        tree = []
        for name, space in env.model.spaces.items():
            cells = []
            for cname in space.cells.keys():
                cells.append(cname)
            tree.append({
                "space": name,
                "cells_count": len(cells),
                "cells": sorted(cells)[:40],
            })
        return tree

    def compare_products(
        self, product_a_id: str, point_a_id: int, product_b_id: str, point_b_id: int
    ) -> CompareResponse:
        """Run two product projections side-by-side for comparison."""
        proj_a = self.get_projection(product_a_id, point_a_id)
        proj_b = self.get_projection(product_b_id, point_b_id)
        return CompareResponse(product_a=proj_a, product_b=proj_b)

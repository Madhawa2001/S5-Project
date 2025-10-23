from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, List
from pathlib import Path
import pandas as pd
import numpy as np

from app.security import verify_jwt
from app.models.joblib_model import JoblibModel
from app.core.db import db
from app.preprocess.feature_mappers import FEATURE_MAPPERS, COLUMN_ORDERS
from app.preprocess.hormone_preprocessor import preprocess_domain_rules

import shap, io, base64
# import matplotlib.pyplot as plt

router = APIRouter()

class PredictInput(BaseModel):
    features: Dict

class SensitivityInput(BaseModel):
    features: Dict
    continuous_features: List[str] = [
        "LBDBPBSI", "LBDBCDSI", "LBDTHGSI", "LBDBSESI", "LBDBMNSI"
    ]
    continuous_features_2: List[str] = [
        "LBXBPB", "LBXBCD", "LBXTHG", "LBXSE", "LBXBMN"
    ]
    num_points: int = 1000

MODELS_DIR = Path(__file__).parent.parent / "models" / "saved"

# --- Load models ---
MODELS = {
    "hormone": {
        "testosterone": JoblibModel(MODELS_DIR / "xgb_model_tst_03.joblib"),
        "estradiol": JoblibModel(MODELS_DIR / "xgb_model_est_02.joblib"),
        "shbg": JoblibModel(MODELS_DIR / "xgb_model_shbg_03.joblib"),
    },
    "menopause": JoblibModel(MODELS_DIR / "Menopause_Pipeline_Model.joblib"),
    "menstrual": JoblibModel(MODELS_DIR / "Menstrual_Pipeline_Model.joblib"),
    "infertility": JoblibModel(MODELS_DIR / "best_model_risk_only.joblib"),
}

def build_feature_df(features: Dict, model_key: str) -> pd.DataFrame:
    mapper = FEATURE_MAPPERS.get(model_key)
    if not mapper:
        raise ValueError(f"No feature mapper for {model_key}")
    mapped = mapper(features)
    # print(f"Mapped features for {model_key}: {mapped}")
    if model_key == "infertility":
        return mapped
    else:
        return pd.DataFrame([mapped])

def feature_sensitivity(model, X_row: pd.Series, feature: str, num_points: int = 1000):
    """Return x (feature values) and y (predictions) without plotting."""
    base_value = X_row[feature]
    fmin, fmax = base_value * 0.1, base_value * 10
    feature_values = np.linspace(fmin, fmax, num_points)

    varied_rows = pd.DataFrame([X_row.values] * num_points, columns=X_row.index)
    varied_rows[feature] = feature_values

    preds = model.predict(varied_rows)

    return feature_values.tolist(), preds.tolist()

@router.post("/{model}")
async def predict(model: str, input: PredictInput, user=Depends(verify_jwt)):
    if "doctor" not in user.get("roles", []) and "nurse" not in user.get("roles", []):
        raise HTTPException(status_code=403, detail="Forbidden")

    if model not in MODELS:
        raise HTTPException(status_code=404, detail=f"Unknown model: {model}")

    # print(input.features)

    # --- Special case: hormone (multi-model predictions) ---
    if model == "hormone":
        results = {}
        for sm, clf in MODELS["hormone"].items():
            key = f"hormone_{sm}"
            X = build_feature_df(input.features, key)
            X = preprocess_domain_rules(X)
            print(X)
            y_pred = clf.predict(X)
            value = float(y_pred[0])
            print("="*20)
            print(f"{key} prediction: {value}")

            patient_id = input.features.get("id")
            if patient_id not in (None, "None"):
                await db.prediction.create(
                    data={
                        "patientId": patient_id,
                        "model": key,
                        "value": value
                    }
                )
            results[key] = value
            
        return {"model": model, "predictions": results}

    # --- Normal single-model case ---
    clf = MODELS[model]
    # print(input.features)
    X = build_feature_df(input.features, model)
    print(X)
    y_pred = clf.predict(X)
    value = float(y_pred[0])
    print("="*20)
    print(f"{model} prediction: {value}")

    patient_id = input.features.get("id")
    if patient_id not in (None, "None"):
        await db.prediction.create(
            data={
                "patientId": patient_id,
                "model": model,
                "value": value
            }
        )

    return {"model": model, "prediction": value}

@router.post("/sensitivity/{model}")
async def sensitivity(model: str, input: SensitivityInput, user=Depends(verify_jwt)):
    if "doctor" not in user.get("roles", []) and "nurse" not in user.get("roles", []):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if model not in MODELS:
        raise HTTPException(status_code=404, detail=f"Unknown model: {model}")

    results = {}

    # --- Multi-model case (like hormone) ---
    if isinstance(MODELS[model], dict):
        for sm, clf in MODELS[model].items():
            mapper_key = f"{model}_{sm}"   
            X = build_feature_df(input.features, mapper_key)

            # ✅ only hormone models get preprocessed
            if model == "hormone":
                X = preprocess_domain_rules(X)

            X_row = X.iloc[0]

            feature_results = {}
            for feature in input.continuous_features:
                if feature in X_row.index:
                    base_val = X_row[feature]

                    if base_val is None or pd.isna(base_val):
                        print(f"⚠️ Skipping '{feature}' — missing or invalid base value")
                        continue
                    try:
                        base_val = float(base_val)
                    except (TypeError, ValueError):
                        print(f"⚠️ Skipping '{feature}' — non-numeric base value ({base_val})")
                        continue

                    x_vals, y_vals = feature_sensitivity(clf, X_row, feature, input.num_points)
                    if not x_vals or not y_vals:
                        continue

                    try:
                        original_y = float(clf.predict(pd.DataFrame([X_row]))[0])
                    except Exception as e:
                        print(f"⚠️ Model prediction failed for '{feature}': {e}")
                        continue

                    feature_results[feature] = {
                        "x": x_vals,
                        "y": y_vals,
                        "original_x": base_val,
                        "original_y": original_y,
                    }

            results[mapper_key] = feature_results

    # --- Single-model case ---
    else:
        clf = MODELS[model]
        X = build_feature_df(input.features, model)
        X_row = X.iloc[0]


        feature_results = {}
        for feature in input.continuous_features_2:
            if feature in X_row.index:
                base_val = X_row[feature]

                if base_val is None or pd.isna(base_val):
                    print(f"⚠️ Skipping '{feature}' — missing or invalid base value")
                    continue
                try:
                    base_val = float(base_val)
                except (TypeError, ValueError):
                    print(f"⚠️ Skipping '{feature}' — non-numeric base value ({base_val})")
                    continue

                x_vals, y_vals = feature_sensitivity(clf, X_row, feature, input.num_points)
                if not x_vals or not y_vals:
                    continue

                try:
                    original_y = float(clf.predict(pd.DataFrame([X_row]))[0])
                except Exception as e:
                    print(f"⚠️ Model prediction failed for '{feature}': {e}")
                    continue

                feature_results[feature] = {
                    "x": x_vals,
                    "y": y_vals,
                    "original_x": base_val,
                    "original_y": original_y,
                }

        results[model] = feature_results

    # print({"model": model, "sensitivity": results})
    return {"model": model, "sensitivity": results}

# @router.post("/shap/{model}")
# async def shap_analysis(model: str, input: PredictInput, user=Depends(verify_jwt)):
#     """Compute SHAP feature contribution analysis for any model."""
#     if "doctor" not in user.get("roles", []) and "nurse" not in user.get("roles", []):
#         raise HTTPException(status_code=403, detail="Forbidden")

#     if model not in MODELS:
#         raise HTTPException(status_code=404, detail=f"Unknown model: {model}")

#     results = {}

#     def unwrap_model(obj):
#         """Recursively unwrap pipelines to get the actual model."""
#         from sklearn.pipeline import Pipeline
#         if isinstance(obj, Pipeline):
#             # Try to unwrap last step
#             last_step = list(obj.named_steps.values())[-1]
#             return unwrap_model(last_step)
#         return obj

#     def compute_shap_for_model(clf, mapper_key: str, features: Dict):
#         """Extract model + preprocessor, compute SHAP values, and return JSON."""
#         try:
#             X = build_feature_df(features, mapper_key)
#             if "hormone" in mapper_key:
#                 X = preprocess_domain_rules(X)

#             pipeline = clf.model

#             # --- Find preprocessor and model ---
#             preprocessor = None
#             try:
#                 preprocessor = pipeline.named_steps["preprocessor_and_model"].named_steps.get("preprocessor", None)
#                 model_obj = pipeline.named_steps["preprocessor_and_model"].named_steps["model"]
#             except Exception:
#                 preprocessor = pipeline.named_steps.get("preprocessor", None)
#                 model_obj = pipeline.named_steps.get("model", pipeline)

#             # --- Unwrap final estimator if still a pipeline ---
#             model_obj = unwrap_model(model_obj)

#             # --- Transform features ---
#             X_transformed = preprocessor.transform(X) if preprocessor else X
#             feature_names = (
#                 preprocessor.get_feature_names_out()
#                 if preprocessor and hasattr(preprocessor, "get_feature_names_out")
#                 else X.columns
#             )

#             # --- Pick the right SHAP explainer ---
#             if "xgboost" in str(type(model_obj)).lower() or "xgb" in str(type(model_obj)).lower():
#                 explainer = shap.TreeExplainer(model_obj)
#                 shap_values = explainer.shap_values(X_transformed)
#                 expected_value = explainer.expected_value
#             else:
#                 # Fallback for sklearn models
#                 bg = X_transformed[:30] if len(X_transformed) > 30 else X_transformed
#                 explainer = shap.KernelExplainer(model_obj.predict, bg)
#                 shap_values = explainer.shap_values(X_transformed[:1])
#                 expected_value = float(np.mean(model_obj.predict(bg)))

#             shap_vals_row = shap_values[0] if hasattr(shap_values, "__len__") else shap_values
#             features_used = list(feature_names)
#             values_used = np.array(shap_vals_row).flatten().tolist()

#             # --- Optional SHAP bar plot ---
#             # shap_plot = None
#             # try:
#             #     import matplotlib.pyplot as plt
#             #     shap.summary_plot(
#             #         shap_values,
#             #         X_transformed,
#             #         feature_names=feature_names,
#             #         show=False
#             #     )
#             #     buf = io.BytesIO()
#             #     plt.savefig(buf, format="png", bbox_inches="tight")
#             #     plt.close()
#             #     shap_plot = base64.b64encode(buf.getvalue()).decode("utf-8")
#             # except Exception as e:
#             #     print(f"⚠️ SHAP plot generation failed for {mapper_key}: {e}")

#             return {
#                 "expected_value": float(expected_value),
#                 "features": features_used,
#                 "values": values_used,
#                 # "plot": shap_plot,
#             }

#         except Exception as e:
#             print(f"❌ SHAP computation failed for {mapper_key}: {e}")
#             return {"error": str(e)}

#     # --- Multi-model case (like hormone) ---
#     if isinstance(MODELS[model], dict):
#         for sm, clf in MODELS[model].items():
#             mapper_key = f"{model}_{sm}"
#             results[mapper_key] = compute_shap_for_model(clf, mapper_key, input.features)

#     # --- Single-model case ---
#     else:
#         clf = MODELS[model]
#         results[model] = compute_shap_for_model(clf, model, input.features)

#     return {"model": model, "shap": results}


@router.post("/shap/{model}")
async def shap_analysis(model: str, input: PredictInput, user=Depends(verify_jwt)):
    """
    Compute SHAP feature contribution analysis for any model (Pipeline or raw estimator).
    Supports multi-model entries (like hormone groups) and nested pipelines.
    """

    # --- Authorization ---
    if "doctor" not in user.get("roles", []) and "nurse" not in user.get("roles", []):
        raise HTTPException(status_code=403, detail="Forbidden")

    # --- Validate model key ---
    if model not in MODELS:
        raise HTTPException(status_code=404, detail=f"Unknown model: {model}")

    import shap
    import numpy as np
    from sklearn.pipeline import Pipeline

    results = {}

    # -------------------------------------------------------------
    # --- Helper: unwrap deeply nested pipelines -----------------
    # -------------------------------------------------------------
    def unwrap_model(obj):
        """Recursively unwrap pipelines and nested model containers to get the final estimator."""
        if isinstance(obj, Pipeline):
            try:
                last_step = list(obj.named_steps.values())[-1]
                return unwrap_model(last_step)
            except Exception:
                return obj
        if hasattr(obj, "model"):
            return unwrap_model(obj.model)
        return obj

    # -------------------------------------------------------------
    # --- Core: SHAP computation per submodel --------------------
    # -------------------------------------------------------------
    def compute_shap_for_model(clf, mapper_key: str, features: Dict):
        try:
            # --- Step 1: Build input DataFrame ---
            X = build_feature_df(features, mapper_key)
            if "hormone" in mapper_key:
                X = preprocess_domain_rules(X)

            pipeline = clf.model  # e.g. your JoblibModel wrapper exposes .model

            # --- Step 2: Identify preprocessor & model -------------
            preprocessor, model_obj = None, None
            try:
                if isinstance(pipeline, Pipeline):
                    if "preprocessor_and_model" in pipeline.named_steps:
                        inner = pipeline.named_steps["preprocessor_and_model"]
                        preprocessor = inner.named_steps.get("preprocessor", None)
                        model_obj = inner.named_steps.get("model", inner)
                    else:
                        preprocessor = pipeline.named_steps.get("preprocessor", None)
                        model_obj = pipeline.named_steps.get("model", pipeline)
                else:
                    model_obj = pipeline
            except Exception as e:
                print(f"⚠️ Error extracting preprocessor/model for {mapper_key}: {e}")
                model_obj = unwrap_model(pipeline)

            # --- Step 3: Transform input if preprocessor exists -----
            X_transformed = X
            if preprocessor is not None and hasattr(preprocessor, "transform"):
                try:
                    X_transformed = preprocessor.transform(X)
                except Exception as e:
                    print(f"⚠️ Preprocessor transform failed for {mapper_key}: {e}")

            # --- Step 4: Get feature names (post-transform) ---------
            if preprocessor is not None and hasattr(preprocessor, "get_feature_names_out"):
                feature_names = preprocessor.get_feature_names_out()
            else:
                feature_names = X.columns

            # --- Step 5: Unwrap model completely --------------------
            model_obj = unwrap_model(model_obj)
            print(f"🧩 Final model for {mapper_key}: {type(model_obj)}")

            # --- Step 6: Compute SHAP values ------------------------
            try:
                model_name = str(type(model_obj)).lower()
                if any(k in model_name for k in ["xgb", "xgboost", "lightgbm", "randomforest", "gradientboosting"]):
                    explainer = shap.TreeExplainer(model_obj)
                    shap_values = explainer.shap_values(X_transformed)
                    expected_value = explainer.expected_value
                else:
                    # Kernel fallback for linear or sklearn models
                    bg = X_transformed[:30] if len(X_transformed) > 30 else X_transformed
                    explainer = shap.KernelExplainer(model_obj.predict, bg)
                    shap_values = explainer.shap_values(X_transformed[:1])
                    expected_value = float(np.mean(model_obj.predict(bg)))
            except Exception as e:
                print(f"⚠️ TreeExplainer failed for {mapper_key}, fallback to KernelExplainer: {e}")
                bg = X_transformed[:30] if len(X_transformed) > 30 else X_transformed
                explainer = shap.KernelExplainer(model_obj.predict, bg)
                shap_values = explainer.shap_values(X_transformed[:1])
                expected_value = float(np.mean(model_obj.predict(bg)))

            # --- Step 7: Format result JSON -------------------------
            shap_vals_row = shap_values[0] if hasattr(shap_values, "__len__") else shap_values
            shap_vals_row = np.array(shap_vals_row).flatten().tolist()
            features_used = list(feature_names)

            return {
                "expected_value": float(expected_value) if not isinstance(expected_value, list) else float(np.mean(expected_value)),
                "features": features_used,
                "values": shap_vals_row,
            }

        except Exception as e:
            print(f"❌ SHAP computation failed for {mapper_key}: {e}")
            return {"error": str(e)}

    # -------------------------------------------------------------
    # --- Multi-model support ------------------------------------
    # -------------------------------------------------------------
    if isinstance(MODELS[model], dict):
        for sm, clf in MODELS[model].items():
            mapper_key = f"{model}_{sm}"
            results[mapper_key] = compute_shap_for_model(clf, mapper_key, input.features)
    else:
        clf = MODELS[model]
        results[model] = compute_shap_for_model(clf, model, input.features)

    # -------------------------------------------------------------
    # --- Debug / return ------------------------------------------
    # -------------------------------------------------------------
    print("=" * 30)
    print({"model": model, "shap": results})
    print("=" * 30)

    return {"model": model, "shap": results}

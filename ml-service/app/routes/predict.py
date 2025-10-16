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
    "infertility": JoblibModel(MODELS_DIR / "infertility_xgboost_risk_only.joblib"),
}

def build_feature_df(features: Dict, model_key: str) -> pd.DataFrame:
    mapper = FEATURE_MAPPERS.get(model_key)
    if not mapper:
        raise ValueError(f"No feature mapper for {model_key}")
    mapped = mapper(features)
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
    
    print(input.features)

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

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict
from pathlib import Path
import pandas as pd

from app.security import verify_jwt
from app.models.joblib_model import JoblibModel
from app.core.db import db
from app.preprocess.feature_mappers import FEATURE_MAPPERS, COLUMN_ORDERS

router = APIRouter()

class PredictInput(BaseModel):
    features: Dict

MODELS_DIR = Path(__file__).parent.parent / "models" / "saved"

# --- Load models ---
MODELS = {
    "hormone": {
        "testosterone": JoblibModel(MODELS_DIR / "xgb_model_tst_01.joblib"),
        # "estradiol": JoblibModel(MODELS_DIR / "hormone_estradiol.joblib"),
        # "shbg": JoblibModel(MODELS_DIR / "hormone_shbg.joblib"),
    }
}

def build_feature_df(features: Dict, model_key: str) -> pd.DataFrame:
    mapper = FEATURE_MAPPERS.get(model_key)
    if not mapper:
        raise ValueError(f"No feature mapper for {model_key}")
    mapped = mapper(features)
    return pd.DataFrame([mapped])

@router.post("/{model}")
async def predict(model: str, input: PredictInput, user=Depends(verify_jwt)):
    if "doctor" not in user.get("roles", []):
        raise HTTPException(status_code=403, detail="Forbidden")

    if model not in MODELS:
        raise HTTPException(status_code=404, detail=f"Unknown model: {model}")

    # --- Special case: hormone (multi-model predictions) ---
    if model == "hormone":
        results = {}
        for sm, clf in MODELS["hormone"].items():
            key = f"hormone_{sm}"
            X = build_feature_df(input.features, key)
            print(X)
            y_pred = clf.predict(X)
            value = float(y_pred[0])

            await db.prediction.create(
                data={
                    "patientId": input.features["id"],
                    "model": key,
                    "value": value
                }
            )
            results[key] = value
            
        return {"model": model, "predictions": results}

    # --- Normal single-model case ---
    clf = MODELS[model]
    X = build_feature_df(input.features, model)
    y_pred = clf.predict(X)
    value = float(y_pred[0])

    await db.prediction.create(
        data={
            "patientId": input.features["id"],
            "model": model,
            "value": value
        }
    )

    return {"model": model, "prediction": value}

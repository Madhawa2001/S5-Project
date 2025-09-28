from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict
from pathlib import Path
import pandas as pd

from app.security import verify_jwt
from app.models.joblib_model import JoblibModel
from app.core.db import db

router = APIRouter()

class PredictInput(BaseModel):
    features: Dict

MODELS_DIR = Path(__file__).parent.parent / "models" / "saved"

# --- Define feature orders ---
COLUMN_ORDERS = {
    "hormone_testosterone": ['LBDBSESI', 'LBDTHGSI', 'LBDBCDSI', 'LBDBPBSI', 'RIDAGEMN',
       'LBDBMNSI', 'RHQ131', 'RIAGENDR', 'RIDEXPRG', 'BMXBMI'
       ],
    "hormone_estradiol": [
        "RIDEXPRG","LBDBMNSI","RIDAGEMN","LBDBSESI","BMXBMI","LBDBCDSI",
        "LBDTHGSI","LBDBPBSI","RHQ031","RHQ160","is_menopausal","RHQ200",
        "RIAGENDR","BMDSADCM"
    ],
    "hormone_shbg": [
        "BMXBMI","RIDAGEMN","RIDEXPRG","LBDBMNSI","LBDBPBSI",
        "LBDBSESI","LBDTHGSI","LBDBCDSI","RHQ160","RIAGENDR","BMDSADCM"
    ]
}

# --- Load models ---
MODELS = {
    "hormone": {
        "testosterone": JoblibModel(MODELS_DIR / "xgb_model_tst_01.joblib"),
        # "estradiol": JoblibModel(MODELS_DIR / "hormone_estradiol.joblib"),
        # "shbg": JoblibModel(MODELS_DIR / "hormone_shbg.joblib"),
    },
    # "infertility": JoblibModel(MODELS_DIR / "infertility.joblib"),
    # "menstrual": JoblibModel(MODELS_DIR / "menstrual.joblib"),
    # "menopause": JoblibModel(MODELS_DIR / "menopause.joblib"),
}

def reorder_features(features: Dict, model_key: str):
    order = COLUMN_ORDERS.get(model_key)
    if not order:
        return pd.DataFrame([features])  # default: raw order
    return pd.DataFrame([[features.get(col) for col in order]], columns=order)

# --- Single endpoint ---
@router.post("/{model}")
async def predict(model: str, input: PredictInput, user=Depends(verify_jwt)):
    if "doctor" not in user.get("roles", []):
        raise HTTPException(status_code=403, detail="Forbidden")

    if model not in MODELS:
        raise HTTPException(status_code=404, detail=f"Unknown model: {model}")

    # --- Special case: hormone (always multi-model) ---
    if model == "hormone":
        results = {}
        for sm, clf in MODELS["hormone"].items():
            key = f"hormone_{sm}"
            X = reorder_features(input.features, key)
            print(input.features)
            print("+"*30)
            print(X)
            y_pred = clf.predict(X)
            value = float(y_pred[0])
            print("="*30)
            print(f"Predicted {key}: {value}")

            # save in db
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
    X = reorder_features(input.features, model)
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

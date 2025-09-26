from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from pathlib import Path
import pandas as pd

from app.security import verify_jwt
from app.models.joblib_model import JoblibModel
from app.core.db import db
from app.preprocess.hormone_preprocessor import preprocess_patient_for_hormone_prediction

router = APIRouter()

class PredictInput(BaseModel):
    features: Dict

MODELS_DIR = Path(__file__).parent.parent / "models" / "saved"

# --- Define feature orders ---
COLUMN_ORDERS = {
    "hormone_testosterone": [
        "RIDAGEMN","RIAGENDR","RIDEXPRG","BMXBMI","LBDBMNSI",
        "LBDBCDSI","LBDBSESI","LBDBPBSI","LBDTHGSI","RHQ160","BMDSADCM"
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
        "testosterone": JoblibModel(MODELS_DIR / "hormone_testosterone.joblib"),
        "estradiol": JoblibModel(MODELS_DIR / "hormone_estradiol.joblib"),
        "shbg": JoblibModel(MODELS_DIR / "hormone_shbg.joblib"),
    },
    "infertility": JoblibModel(MODELS_DIR / "infertility.joblib"),
    "menstrual": JoblibModel(MODELS_DIR / "menstrual.joblib"),
    "menopause": JoblibModel(MODELS_DIR / "menopause.joblib"),
}

def reorder_features(features: Dict, model_key: str):
    order = COLUMN_ORDERS.get(model_key)
    if not order:
        return pd.DataFrame([features])  # default: raw order
    return pd.DataFrame([[features.get(col) for col in order]], columns=order)

@router.post("/{model}/{submodel}")
async def predict(model: str, submodel: Optional[str] = None, input: PredictInput = None, user=Depends(verify_jwt)):
    if "doctor" not in user.get("roles", []):
        raise HTTPException(status_code=403, detail="Forbidden")

    if model not in MODELS:
        raise HTTPException(status_code=404, detail=f"Unknown model: {model}")

    # --- Multi-model case (hormone) ---
    if model == "hormone" and submodel is None:
        results = {}
        for sm, clf in MODELS["hormone"].items():
            key = f"hormone_{sm}"
            X = reorder_features(input.features, key)
            y_pred = clf.predict(X)
            value = float(y_pred[0])

            # save in db
            await prisma.prediction.create(
                data={
                    "patientId": input.features["id"],
                    "model": key,
                    "value": value
                }
            )
            results[key] = value
        return {"model": model, "predictions": results}

    # --- Single model case ---
    clf = MODELS[model] if submodel is None else MODELS[model].get(submodel)
    if clf is None:
        raise HTTPException(status_code=404, detail=f"Unknown submodel: {submodel}")

    key = model if not submodel else f"{model}_{submodel}"
    X = reorder_features(input.features, key)
    y_pred = clf.predict(X)
    value = float(y_pred[0])

    await db.prediction.create(
        data={
            "patientId": input.features["id"],
            "model": key,
            "value": value
        }
    )

    return {"model": model, "submodel": submodel, "prediction": value}

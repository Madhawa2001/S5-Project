from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from pathlib import Path

from app.security import verify_jwt
from app.models.joblib_model import JoblibModel
from app.preprocess.hormone_preprocessor import preprocess_patient_for_hormone_prediction
# from app.preprocess.menstrual_preprocessor import preprocess_patient_for_menstrual_prediction

# --- Router ---
router = APIRouter()

# --- Schemas ---
class PredictInput(BaseModel):
    features: Dict

# --- Load models at startup ---
MODELS_DIR = Path(__file__).parent.parent.parent / "app" / "models" / "saved"
MODELS = {
    "hormone": JoblibModel(MODELS_DIR / "model_LBXEST.joblib", preprocess_patient_for_hormone_prediction),
    # "menstrual": JoblibModel("models/menstrual_model.joblib", preprocess_patient_for_menstrual_prediction),
}

@router.post("/{model}/{method}")
def predict(model: str, method: str, input: Optional[PredictInput] = None, user=Depends(verify_jwt)):
    if "doctor" not in user.get("roles", []):
        raise HTTPException(status_code=403, detail="Forbidden")

    if model not in MODELS:
        raise HTTPException(status_code=404, detail=f"Unknown model: {model}")
    print(f"Using input: {input}")
    clf = MODELS[model]

    if not input or not input.features:
        raise HTTPException(status_code=400, detail="Missing features")

    # Preprocess
    X = clf.preprocess(input.features)

    # Predict
    y_pred = clf.predict(X)

    return {
        "model": model,
        "method": method,
        "prediction": y_pred.tolist(),
    }

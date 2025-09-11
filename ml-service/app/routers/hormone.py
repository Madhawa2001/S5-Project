from fastapi import APIRouter
from app.services.patient_service import get_patient_with_blood_metals
from app.ml.preprocessing import preprocess_hormone
from app.schemas.prediction import HormonePredictionResponse

router = APIRouter(prefix="/predict/hormone", tags=["Hormone"])

@router.get("/{patient_id}", response_model=HormonePredictionResponse)
async def predict_hormone(patient_id: str):
    patient = await get_patient_with_blood_metals(patient_id)
    features = preprocess_hormone(patient)

    # 🔮 Dummy prediction (later load real model here)
    prediction = 0.75  

    return HormonePredictionResponse(
        patient_id=patient_id,
        features=features.to_dict(orient="records")[0],
        prediction=prediction
    )

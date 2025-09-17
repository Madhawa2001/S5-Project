from fastapi import APIRouter
from app.services.patient_service import get_patient_with_blood_metals
from app.preprocess.hormoneModel_preprocessor import preprocess_patient_for_hormone_prediction
from app.schemas.prediction import HormonePredictionResponse

router = APIRouter(prefix="/predict/hormone", tags=["Hormone"])

@router.get("/{patient_id}", response_model=HormonePredictionResponse)
async def predict_hormone(patient_id: str):
    patient = await get_patient_with_blood_metals(patient_id)
    features = preprocess_patient_for_hormone_prediction(patient)
    #print(patient)

    # 🔮 Dummy prediction (later load real model here)
    prediction = 0.75

    return HormonePredictionResponse(
        patient_id=patient_id,
        features=features.to_dict(orient="records")[0],
        prediction=prediction
    )

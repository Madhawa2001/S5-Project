from fastapi import APIRouter
from app.services.patient_service import get_patient_with_blood_metals
from app.preprocess.hormoneModel_preprocessor import preprocess_patient_for_hormone_prediction
from app.schemas.prediction import HormonePredictionResponse, PatientFeatures_Hormone

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

@router.post("/from-features", response_model=HormonePredictionResponse)
async def predict_hormone_from_features(features: PatientFeatures_Hormone):
    # Convert Pydantic object to dict like DB object
    patient_dict = {
        "pregnancyStatus": features.pregnancyStatus,
        "ageMonths": features.ageMonths,
        "pregnancyCount": features.pregnancyCount,
        "gender": features.gender,
        "BloodMetals": [{
            "selenium_umolL": features.selenium_umolL,
            "mercury_umolL": features.mercury_umolL,
            "cadmium_umolL": features.cadmium_umolL,
            "lead_umolL": features.lead_umolL,
            "manganese_umolL": features.manganese_umolL,
        }],
        "RHQ200": features.RHQ200,
        "is_menopausal": features.is_menopausal,
        "BMXBMI": features.BMXBMI,
        "BMDSADCM": features.BMDSADCM,
    }

    # Preprocess
    X = preprocess_patient_for_hormone_prediction(patient_dict)
    print(X)

    # 🔮 Dummy predictions (replace with your ML models)
    predictions = {
        "testosterone": 0.72,
        "estradiol": 0.85,
        "shbg": 0.65
    }

    return HormonePredictionResponse(
        patient_id="N/A",  # not from DB
        features=patient_dict,
        predictions=predictions
    )
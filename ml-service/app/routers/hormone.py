from fastapi import APIRouter
from app.services.patient_service import get_patient_with_blood_metals
from app.preprocess.hormoneModel_preprocessor import preprocess_patient_for_hormone_prediction
from app.schemas.prediction import HormonePredictionResponse, PatientFeatures_Hormone
from app.models.joblib_model import JoblibModel
import os
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # ml_service/
MODEL_DIR = BASE_DIR / "models" / "saved"

router = APIRouter(prefix="/predict/hormone", tags=["Hormone"])


testosterone_model = JoblibModel(
    path=MODEL_DIR / "model_LBXTST.joblib",
    preprocess_fn=preprocess_patient_for_hormone_prediction
)

estradiol_model = JoblibModel(
    path=MODEL_DIR / "model_LBXEST.joblib",
    preprocess_fn=preprocess_patient_for_hormone_prediction
)

shbg_model = JoblibModel(
    path=MODEL_DIR / "model_LBXSHBG.joblib",
    preprocess_fn=preprocess_patient_for_hormone_prediction
)


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
        "RHQ031": features.RHQ031,
        "is_menopausal": features.is_menopausal,
        "BMXBMI": features.BMXBMI,
        "BMDSADCM": features.BMDSADCM,
    }

    # Preprocess
    X = preprocess_patient_for_hormone_prediction(patient_dict)

    column_order_tst = [
        'RIDAGEMN', 'RIAGENDR', 'RIDEXPRG', 'BMXBMI', 'LBDBMNSI', 'LBDBCDSI', 'LBDBSESI', 'LBDBPBSI', 'LBDTHGSI', 'RHQ160', 'BMDSADCM']
    column_order_est = [
        "RIDEXPRG","LBDBMNSI","RIDAGEMN","LBDBSESI","BMXBMI","LBDBCDSI","LBDTHGSI","LBDBPBSI","RHQ031","RHQ160","is_menopausal","RHQ200","RIAGENDR","BMDSADCM",]
    column_order_shbg = [
        'BMXBMI', 'RIDAGEMN', 'RIDEXPRG', 'LBDBMNSI', 'LBDBPBSI', 'LBDBSESI', 'LBDTHGSI', 'LBDBCDSI', 'RHQ160', 'RIAGENDR', 'BMDSADCM']

    df_est = X.reindex(columns=column_order_est)
    df_est.replace({None: np.nan}, inplace=True)

    df_tst = X.reindex(columns=column_order_tst)
    df_tst.replace({None: np.nan}, inplace=True)

    df_shbg = X.reindex(columns=column_order_shbg)
    df_shbg.replace({None: np.nan}, inplace=True)
    # print(X)

    # 🔮 Dummy predictions (replace with your ML models)
    predictions = {
        "testosterone": float(testosterone_model.predict(df_tst)[0]),
        "estradiol": float(estradiol_model.predict(df_est)[0]),
        "shbg": float(shbg_model.predict(df_shbg)[0]),
    }


    return HormonePredictionResponse(
        patient_id="N/A",  # not from DB
        features=patient_dict,
        predictions=predictions
    )
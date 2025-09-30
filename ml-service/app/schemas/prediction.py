# app/schemas/patient_features.py
from pydantic import BaseModel
from typing import Optional, Dict, Any


class PatientFeatures_Hormone(BaseModel):
    pregnancyStatus: Optional[bool] = None
    ageMonths: Optional[int] = None
    pregnancyCount: Optional[int] = None
    gender: Optional[str] = None
    
    selenium_umolL: Optional[float] = None
    mercury_umolL: Optional[float] = None
    cadmium_umolL: Optional[float] = None
    lead_umolL: Optional[float] = None
    manganese_umolL: Optional[float] = None

    RHQ200: Optional[str] = None        # "yes"/"no" → breastfeeding
    RHQ031: Optional[str] = None        # "yes"/"no" → regular periods
    is_menopausal: Optional[str] = None # "yes"/"no"
    BMXBMI: Optional[float] = None      # BMI
    BMDSADCM: Optional[float] = None    # Abdomen diameter


class HormonePredictionResponse(BaseModel):
    patient_id: str
    features: Dict[str, Any]
    predictions: Dict[str, float]  # testosterone, estradiol, shbg

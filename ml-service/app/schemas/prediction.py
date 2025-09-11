from pydantic import BaseModel
from typing import Dict, Any

class HormonePredictionResponse(BaseModel):
    patient_id: str
    features: Dict[str, Any]
    prediction: float

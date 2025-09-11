from app.core.db import db
from fastapi import HTTPException

async def get_patient_with_blood_metals(patient_id: str):
    patient = await db.patient.find_unique(
        where={"id": patient_id},
        include={"bloodMetals": {"order_by": {"createdAt": "desc"}}}
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

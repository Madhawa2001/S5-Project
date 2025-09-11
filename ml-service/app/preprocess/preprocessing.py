import pandas as pd
import numpy as np

def preprocess_hormone(patient: dict) -> pd.DataFrame:
    blood = (patient.get("bloodMetals") or [{}])[0]

    features = {
        "RIDEXPRG": 1 if patient.get("pregnancyStatus") else 0,
        "LBDBSESI": float(blood.get("selenium_umolL", np.nan)),
        "LBDTHGSI": float(blood.get("mercury_umolL", np.nan)),
        "LBDBCDSI": float(blood.get("cadmium_umolL", np.nan)),
        "LBDBPBSI": float(blood.get("lead_umolL", np.nan)),
        "RIDAGEMN": patient.get("ageMonths", np.nan),
        "RHQ160": patient.get("pregnancyCount", np.nan),
        "LBDBMNSI": float(blood.get("manganese_umolL", np.nan)),
        "RIAGENDR": 0 if patient.get("gender") == "male" else 1,
    }

    df = pd.DataFrame([features])
    df.fillna(-999, inplace=True)
    return df

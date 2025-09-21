# app/preprocess/hormoneModel_preprocessor.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, MinMaxScaler
from sklearn.impute import SimpleImputer


# ---------------- Patient-level preprocessing ----------------
def preprocess_hormone(patient) -> pd.DataFrame:
    # Convert ORM / Pydantic object to dict
    if not isinstance(patient, dict):
        if hasattr(patient, "dict"):  # Pydantic
            patient = patient.dict()
        elif hasattr(patient, "__dict__"):  # Prisma/SQLAlchemy
            patient = vars(patient)

    blood = (patient.get("BloodMetals") or [{}])[0]

    # Helper to convert yes/no to 1/0
    def yes_no_to_int(val):
        if val is None or pd.isna(val):
            return np.nan
        if str(val).lower() == "yes":
            return 1
        elif str(val).lower() == "no":
            return 2
        return np.nan  # fallback if something unexpected

    features = {
        "RIDEXPRG": 1 if patient.get("pregnancyStatus") else 0,
        "LBDBSESI": float(blood.get("selenium_umolL", np.nan)),
        "LBDTHGSI": float(blood.get("mercury_umolL", np.nan)),
        "LBDBCDSI": float(blood.get("cadmium_umolL", np.nan)),
        "LBDBPBSI": float(blood.get("lead_umolL", np.nan)),
        "RIDAGEMN": patient.get("ageMonths", np.nan),
        "RHQ160": patient.get("pregnancyCount", np.nan),
        "LBDBMNSI": float(blood.get("manganese_umolL", np.nan)),
        "RIAGENDR": 1 if str(patient.get("gender", "")).lower() == "male" else 2,

        # Convert yes/no to 1/0
        "RHQ200": yes_no_to_int(patient.get("RHQ200")),           # breastfeeding
        "RHQ031": yes_no_to_int(patient.get("RHQ031")),           # regular periods
        "is_menopausal": yes_no_to_int(patient.get("is_menopausal")),
        "BMXBMI": patient.get("BMXBMI", np.nan),
        "BMDSADCM": patient.get("BMDSADCM", np.nan),
    }

    df = pd.DataFrame([features])
    df.replace({None: np.nan}, inplace=True)
    return df



def preprocess_domain_rules(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    is_male = df["RIAGENDR"] == 1
    is_female = df["RIAGENDR"] == 2
    age = df["RIDAGEMN"]

    # Adjust pregnancy code
    df.loc[is_male, "RIDEXPRG"] = 300
    df.loc[is_female & (age < 20), "RIDEXPRG"] = 202
    df.loc[is_female & (age > 44), "RIDEXPRG"] = 203

    df = mark_male_nans(df, male_code=300)
    return df


def mark_male_nans(df: pd.DataFrame, rhq_prefixes=('RHQ', 'RHD'), male_code=300) -> pd.DataFrame:
    df = df.copy()
    rhq_cols = [col for col in df.columns if any(col.startswith(prefix) for prefix in rhq_prefixes)]
    male_mask = df['RIAGENDR'] == 1
    for col in rhq_cols:
        df.loc[male_mask & df[col].isna(), col] = male_code
    return df


def hormone_preprocessing_pipeline(df: pd.DataFrame, drop_cols=None) -> pd.DataFrame:
    df = df.copy()

    # ----- Drop unwanted columns -----
    if drop_cols:
        drop_existing = [c for c in drop_cols if c in df.columns]
        df.drop(columns=drop_existing, inplace=True)

    # ----- Mode imputation for all columns -----
    imputer = SimpleImputer(strategy="most_frequent")
    df_imputed = pd.DataFrame(imputer.fit_transform(df), columns=df.columns)

    return df_imputed


# ---------------- Full pipeline: patient → ML-ready X ----------------
def preprocess_patient_for_hormone_prediction(patient: dict, drop_cols=None) -> pd.DataFrame:
    df = preprocess_hormone(patient)
    df = preprocess_domain_rules(df)
    X = hormone_preprocessing_pipeline(df, drop_cols=drop_cols)
    return X

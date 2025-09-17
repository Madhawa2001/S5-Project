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

        # ✅ Additional features
        "RHQ200": patient.get("RHQ200", np.nan),           # breastfeeding
        "is_menopausal": patient.get("is_menopausal", np.nan),
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

    # ----- Identify column types -----
    yes_no_cols = [
        col for col in df.columns
        if set(df[col].dropna().astype(str).unique()).issubset(
            {'yes', 'no', 'Yes', 'No', 'YES', 'NO'}
        )
    ]
    cat_cols_oh = [
        col for col in df.columns
        if df[col].dtype == 'object'
        and col not in yes_no_cols
        and df[col].nunique() < 5
    ]
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    high_card_cols = [col for col in numeric_cols if df[col].nunique() > 30]
    low_card_num_cols = [col for col in numeric_cols if df[col].nunique() <= 30]

    yes_no_imputer = SimpleImputer(strategy='most_frequent')
    cat_imputer = SimpleImputer(strategy='most_frequent')
    num_imputer = SimpleImputer(strategy='most_frequent')

    # ----- Encode yes/no -----
    if yes_no_cols:
        X_yes_no_imp = yes_no_imputer.fit_transform(df[yes_no_cols])
        X_yes_no = pd.DataFrame(X_yes_no_imp, columns=yes_no_cols)
        for col in yes_no_cols:
            X_yes_no[col] = X_yes_no[col].str.lower().map({'yes': 1, 'no': 0})
    else:
        X_yes_no = pd.DataFrame()

    # ----- One-hot encode categorical -----
    if cat_cols_oh:
        X_cat_imp = cat_imputer.fit_transform(df[cat_cols_oh])
        X_cat = pd.DataFrame(X_cat_imp, columns=cat_cols_oh)
        ohe = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
        X_cat_ohe = pd.DataFrame(ohe.fit_transform(X_cat), columns=ohe.get_feature_names_out(cat_cols_oh))
    else:
        X_cat_ohe = pd.DataFrame()

    # ----- Scale high-cardinality numeric -----
    if high_card_cols:
        X_high_card_imp = num_imputer.fit_transform(df[high_card_cols])
        scaler = MinMaxScaler()
        X_high_card = pd.DataFrame(scaler.fit_transform(X_high_card_imp), columns=high_card_cols)
    else:
        X_high_card = pd.DataFrame()

    # ----- Keep low-cardinality numeric as is -----
    if low_card_num_cols:
        X_low_card_imp = num_imputer.fit_transform(df[low_card_num_cols])
        X_low_card_num = pd.DataFrame(X_low_card_imp, columns=low_card_num_cols)
    else:
        X_low_card_num = pd.DataFrame()

    # ----- Final dataset -----
    X_processed = pd.concat([X_yes_no, X_cat_ohe, X_high_card, X_low_card_num], axis=1)
    return X_processed


# ---------------- Full pipeline: patient → ML-ready X ----------------
def preprocess_patient_for_hormone_prediction(patient: dict, drop_cols=None) -> pd.DataFrame:
    df = preprocess_hormone(patient)
    df = preprocess_domain_rules(df)
    X = hormone_preprocessing_pipeline(df, drop_cols=drop_cols)
    return X

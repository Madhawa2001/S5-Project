from typing import Dict
import numpy as np
import pandas as pd

# --- Column orders (per model) ---
COLUMN_ORDERS = {
    "hormone_testosterone": [
        'LBDBSESI', 'LBDTHGSI', 'LBDBCDSI', 'LBDBPBSI',
        'RIDAGEMN', 'LBDBMNSI', 'RHQ131', 'RIAGENDR',
        'RIDEXPRG', 'BMXBMI'
    ],
    "hormone_estradiol": ['LBXEST', 'LBDBSESI', 'LBDTHGSI', 'LBDBCDSI', 'LBDBPBSI', 'RIDAGEMN',
       'LBDBMNSI', 'RHQ131', 'RIAGENDR', 'RIDEXPRG', 'BMXBMI', 'RHQ031',
       'is_menopausal'
       ],
    "hormone_shbg": [
        'LBDBSESI', 'LBDTHGSI', 'LBDBCDSI', 'LBDBPBSI',
        'RIDAGEMN', 'LBDBMNSI', 'RHQ131', 'RIAGENDR',
        'RIDEXPRG', 'BMXBMI'
    ],
    "menopause": [   'RIDAGEYR', 'LBXBPB', 'RHQ420',
    'LBXBCD', 'RHQ160', 'LBXBMN',
    'LBXTHG', 'LBXBSE'],

    "menstrual": ['RIDAGEYR', 'RHD280', 'RHQ540',
    'RHQ305', 'DMDMARTL', 'LBXBPB', 'LBXBCD', 'LBXTHG', 'LBXBSE', 'LBXBMN'],

    "menstrual": ['RIDAGEYR', 'RHD280', 'RHQ540',
    'RHQ305', 'DMDMARTL', 'LBXBPB', 'LBXBCD', 'LBXTHG', 'LBXBSE', 'LBXBMN'],

    "infertility": [
        'Blood metal weights','lead_ugdl','cadmium_ugl','mercury_ugl','selenium_ugl',
        'manganese_ugl','regular_periods','last_period_age','pelvic_infection','hysterectomy',
        'birth_control','female_hormones','age_years','race','country_birth','marital_status'
    ],

}

MARITAL_STATUS_MAP = {
    "MARRIED": 1,
    "WIDOWED": 2,
    "DIVORCED": 3,
    "SEPARATED": 4,
    "NEVER_MARRIED": 5,
    "LIVING_WITH_PARTNER": 6,
    "UNKNOWN": 7
}

# --- Common mapper ---
def map_common_features(input: Dict) -> Dict:
    """Extract shared features from the API input into NHANES-style codes."""
    # age_months = input.get("ageYears", 0) * 12 + input.get("ageMonths", 0)
    age_months = input.get("ageMonths", 0)
    age_years = input.get("ageYears", 0)

    gender = input.get("gender")
    gender_code = 1 if gender and gender.lower() == "male" else 2 if gender and gender.lower() == "female" else None


    blood_metals = input.get("bloodMetals") or [{}]
    blood = blood_metals[0] if isinstance(blood_metals, list) and blood_metals else {}

    marital_status = input.get("maritalStatus")
    marital_code = MARITAL_STATUS_MAP.get(str(marital_status).upper()) if marital_status else None


    return {
        "RIDAGEMN": age_months,                            # Age in months
        "RIAGENDR": gender_code,
        "RIDAGEYR": age_years,                             # Age in years
        "RIDEXPRG": int(input.get("pregnancyStatus") or 0),  # Pregnant yes/no
        "RHQ131": 1 if int(input.get("pregnancyCount", 0) or 0) else 2,          # Pregnancy count
        "LBDBPBSI": blood.get("lead_umolL"),               # Lead
        "LBDBCDSI": blood.get("cadmium_umolL"),            # Cadmium
        "LBDTHGSI": blood.get("mercury_umolL"),            # Mercury
        "LBDBSESI": blood.get("selenium_umolL"),           # Selenium
        "LBDBMNSI": blood.get("manganese_umolL"),          # Manganese
        "BMXBMI": input.get("bmi"),                                    # TODO: compute if you have weight+height
        # Extra placeholders for other models
        "RHQ031": None,
        "RHQ160": int(input.get("pregnancyCount", 0) or 0),
        "RHQ200": None,
        "is_menopausal": None,
        "BMDSADCM": None,
        "LBXBPB": blood.get("lead_umolL") / 0.04826 if blood.get("lead_umolL") else None,
        "LBXBCD": blood.get("cadmium_umolL") / 8.897 if blood.get("cadmium_umolL") else None,
        "LBXTHG": blood.get("mercury_umolL") / 4.99 if blood.get("mercury_umolL") else None,
        "LBXBSE": blood.get("selenium_umolL") / 0.01266 if blood.get("selenium_umolL") else None,
        "LBXBMN": blood.get("manganese_umolL") / 18.20 if blood.get("manganese_umolL") else None,
        "DMDMARTL": marital_code,
        "RHD280": 1 if input.get("hadHysterectomy") else 2,        
        # "RHQ166": input.get("vaginalDeliveries"),
        "RHQ540": 1 if input.get("everUsedFemaleHormones") else 2,  
        "RHQ305": 1 if input.get("ovariesRemoved") else 2,  
        # "RHQ074": 1 if input.get("triedYearPregnant") else 2,  
        "RHQ420": 1 if input.get("everUsedBirthControlPills") else 2,
        "race": None,                 
        "country_birth": None,
    }

# --- Model-specific mappers ---
def map_testosterone_features(input: Dict) -> Dict:
    features = map_common_features(input)
    return {col: features.get(col) for col in COLUMN_ORDERS["hormone_testosterone"]}

def map_estradiol_features(input: Dict) -> Dict:
    features = map_common_features(input)
    features["is_menopausal"] = input.get("is_menopausal", 0)
    return {col: features.get(col) for col in COLUMN_ORDERS["hormone_estradiol"]}

def map_shbg_features(input: Dict) -> Dict:
    features = map_common_features(input)
    return {col: features.get(col) for col in COLUMN_ORDERS["hormone_shbg"]}

def map_menopause_features(input: Dict) -> Dict:
    features = map_common_features(input)
    # features["RHD280"] = str(features["RHD280"])
    # features["RHQ074"] = str(features["RHQ074"])
    features["RHQ420"] = str(features["RHQ420"])
    return {col: features.get(col) for col in COLUMN_ORDERS["menopause"]}

def map_menstrual_features(input: Dict) -> Dict:
    features = map_common_features(input)
    features["DMDMARTL"] = str(features["DMDMARTL"])
    features["RHQ540"] = str(features["RHQ540"])
    features["RHQ305"] = str(features["RHQ305"])
    features["RHD280"] = str(features["RHD280"])
    return {col: features.get(col) for col in COLUMN_ORDERS["menstrual"]}

# import pandas as pd

# def map_infertility_features(input: Dict) -> Dict:
#     features = map_common_features(input)

#     # --- Explicit mapping using already-normalized 'features' ---
#     features["lead_ugdl"] = features.get("LBXBPB")
#     features["cadmium_ugl"] = features.get("LBXBCD")
#     features["mercury_ugl"] = features.get("LBXTHG")
#     features["selenium_ugl"] = features.get("LBXBSE")
#     features["manganese_ugl"] = features.get("LBXBMN")

#     # Demographic features
#     features["age_years"] = features.get("RIDAGEYR")
#     features["race"] = features.get("race")
#     features["country_birth"] = features.get("country_birth")
#     features["marital_status"] = features.get("DMDMARTL")

#     # Reproductive / lifestyle history
#     features["regular_periods"] = features.get("RHQ305")
#     features["pelvic_infection"] = features.get("RHQ200")
#     features["hysterectomy"] = features.get("RHD280")
#     features["birth_control"] = features.get("RHQ420")
#     features["female_hormones"] = features.get("RHQ540")
#     features["last_period_age"] = features.get("RHQ160")

#     # --- Convert to DataFrame for safe dtype cleaning ---
#     df = pd.DataFrame([{col: features.get(col) for col in COLUMN_ORDERS["infertility"]}])

#     # 1️⃣ Convert booleans → 1/2
#     df = df.applymap(lambda x: 1 if x is True else (2 if x is False else x))

#     # 2️⃣ Convert "1"/"2" strings → numeric
#     df = df.apply(pd.to_numeric, errors="ignore")

#     # 3️⃣ Encode object-type columns as category codes
#     for col in df.select_dtypes("object"):
#         df[col] = df[col].astype("category").cat.codes

#     # 4️⃣ Return as a dict (like your other mappers)
#     return df.iloc[0].to_dict()

def map_infertility_features(input: Dict) -> Dict:
    features = map_common_features(input)

    # Convert raw metals from µmol/L to µg/L (example conversion)
    blood = input.get("bloodMetals", [{}])[0]
    lead_ugdl = blood.get("lead_umolL", 0) * 20.7
    cadmium_ugl = blood.get("cadmium_umolL", 0) * 112.4
    mercury_ugl = blood.get("mercury_umolL", 0) * 200.6
    selenium_ugl = blood.get("selenium_umolL", 0) * 78.96
    manganese_ugl = blood.get("manganese_umolL", 0) * 54.94

    # --- Compute risk categories (example thresholds) ---
    def risk(val, low, high):
        if val < low:
            return 0
        elif val > high:
            return 2
        return 1

    features["lead_risk"] = risk(lead_ugdl, 1.0, 5.0)
    features["cadmium_risk"] = risk(cadmium_ugl, 0.1, 1.0)
    features["mercury_risk"] = risk(mercury_ugl, 0.5, 5.0)
    features["selenium_risk"] = risk(selenium_ugl, 50, 120)
    features["manganese_risk"] = risk(manganese_ugl, 2.0, 15.0)

    # --- Derived toxic metrics ---
    features["toxic_risk_score"] = np.mean([
        features["lead_risk"],
        features["cadmium_risk"],
        features["mercury_risk"]
    ])
    features["multi_high_risk"] = int(sum(v == 2 for v in [
        features["lead_risk"], features["cadmium_risk"],
        features["mercury_risk"], features["manganese_risk"]
    ]) >= 2)
    features["risk_imbalance"] = abs(features["selenium_risk"] - features["toxic_risk_score"])
    features["high_lead_cadmium"] = int(features["lead_risk"] == 2 and features["cadmium_risk"] == 2)
    features["low_selenium_high_toxics"] = int(features["selenium_risk"] == 0 and features["toxic_risk_score"] > 1)

    # --- Demographics and reproductive ---
    features["regular_periods"] = features.get("RHQ305")
    features["last_period_age"] = features.get("RHQ160")
    features["pelvic_infection"] = features.get("RHQ200")
    features["hysterectomy"] = features.get("RHD280")
    features["birth_control"] = features.get("RHQ420")
    features["female_hormones"] = features.get("RHQ540")
    features["age_years"] = features.get("RIDAGEYR")
    features["race"] = features.get("race")
    features["country_birth"] = features.get("country_birth")
    features["marital_status"] = features.get("DMDMARTL")

    

    # --- Final order as model expects ---
    return {col: features.get(col) for col in COLUMN_ORDERS["infertility"]}

# --- Mapper registry ---
FEATURE_MAPPERS = {
    "hormone_testosterone": map_testosterone_features,
    "hormone_estradiol": map_estradiol_features,
    "hormone_shbg": map_shbg_features,
    "menopause": map_menopause_features,
    "menstrual": map_menstrual_features,
    "infertility": map_infertility_features,
}

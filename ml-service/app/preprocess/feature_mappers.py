from typing import Dict
import numpy as np
import pandas as pd
from preprocess.infertility_preprocessor import preprocess_infertility_for_model

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
         'WTSH2YR', 'LBXBPB', 'LBDBPBSI', 'LBXBCD', 'LBDBCDSI', 'LBXTHG', 'LBDTHGSI', 'LBXBSE', 'LBDBSESI', 'LBXBMN', 'LBDBMNSI',
         'RHQ031', 'RHQ060', 'RHQ078', 'RHD280', 'RHQ420', 'RHQ540', 'RIDAGEYR', 'RIDRETH3', 'DMDBORN4', 'DMDMARTL' ]
    ,

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

# # --- Common mapper ---
# def map_common_features(input: Dict) -> Dict:
#     """Extract shared features from the API input into NHANES-style codes."""
#     # age_months = input.get("ageYears", 0) * 12 + input.get("ageMonths", 0)
#     age_months = input.get("ageMonths", 0)
#     age_years = input.get("ageYears", 0)

#     gender = input.get("gender")
#     gender_code = 1 if gender and gender.lower() == "male" else 2 if gender and gender.lower() == "female" else None


#     blood_metals = input.get("bloodMetals") or [{}]
#     blood = blood_metals[0] if isinstance(blood_metals, list) and blood_metals else {}

#     marital_status = input.get("maritalStatus")
#     marital_code = MARITAL_STATUS_MAP.get(str(marital_status).upper()) if marital_status else None


#     return {
#         "RIDAGEMN": age_months,                            # Age in months
#         "RIAGENDR": gender_code,
#         "RIDAGEYR": age_years,                             # Age in years
#         "RIDEXPRG": int(input.get("pregnancyStatus") or 0),  # Pregnant yes/no
#         "RHQ131": 1 if int(input.get("pregnancyCount", 0) or 0) else 2,          # Pregnancy count
#         "LBDBPBSI": blood.get("lead_umolL"),               # Lead
#         "LBDBCDSI": blood.get("cadmium_umolL"),            # Cadmium
#         "LBDTHGSI": blood.get("mercury_umolL"),            # Mercury
#         "LBDBSESI": blood.get("selenium_umolL"),           # Selenium
#         "LBDBMNSI": blood.get("manganese_umolL"),          # Manganese
#         "BMXBMI": input.get("bmi"),                                    # TODO: compute if you have weight+height
#         # Extra placeholders for other models
#         "RHQ031": input.get("vaginalDeliveries"),
#         "RHQ160": int(input.get("pregnancyCount", 0) or 0),
#         "RHQ200": None,
#         "is_menopausal": None,
#         "BMDSADCM": None,
#         "LBXBPB": blood.get("lead_umolL") / 0.04826 if blood.get("lead_umolL") else None,
#         "LBXBCD": blood.get("cadmium_umolL") / 8.897 if blood.get("cadmium_umolL") else None,
#         "LBXTHG": blood.get("mercury_umolL") / 4.99 if blood.get("mercury_umolL") else None,
#         "LBXBSE": blood.get("selenium_umolL") / 0.01266 if blood.get("selenium_umolL") else None,
#         "LBXBMN": blood.get("manganese_umolL") / 18.20 if blood.get("manganese_umolL") else None,
#         "DMDMARTL": marital_code,
#         "RHD280": 1 if input.get("hadHysterectomy") else 2,        
#         #"RHQ166": input.get("vaginalDeliveries"),
#         "RHQ540": 1 if input.get("everUsedFemaleHormones") else 2,  
#         "RHQ305": 1 if input.get("ovariesRemoved") else 2,  
#         "RHQ060": 1 if input.get("triedYearPregnant") else 2,  
#         "RHQ420": 1 if input.get("everUsedBirthControlPills") else 2,
#         "RIDRETH3": None,                 
#         "DMDBORN4": None,
#         "WTSH2YR": None,
#         "RHQ078": None,
#     }

def map_common_features(input: Dict) -> Dict:
    """Extract shared features from the API input into NHANES-style codes."""

    age_months = input.get("ageMonths", 0)
    age_years = input.get("ageYears", 0)
    gender = input.get("gender")
    gender_code = 1 if gender and gender.lower() == "male" else 2 if gender and gender.lower() == "female" else None

    blood_metals = input.get("bloodMetals") or [{}]
    blood = blood_metals[0] if isinstance(blood_metals, list) and blood_metals else {}

    marital_status = input.get("maritalStatus")
    marital_code = MARITAL_STATUS_MAP.get(str(marital_status).upper()) if marital_status else None

    # --- Helper for safe numeric parsing ---
    def safe_float(x):
        try:
            return None if x is None else float(x)
        except Exception:
            return None

    # --- Read LBX fields (µg/L or µg/dL) ---
    lbxpb = safe_float(blood.get("LBXBPB"))  # µg/dL (lead)
    lbxcd = safe_float(blood.get("LBXBCD"))  # µg/L
    lbxthg = safe_float(blood.get("LBXTHG")) # µg/L
    lbxbse = safe_float(blood.get("LBXBSE")) # µg/L
    lbxbmn = safe_float(blood.get("LBXBMN")) # µg/L

    # --- Atomic weights for conversion ---
    LEAD_US = 207.2
    CADMIUM_US = 112.414
    MERCURY_US = 200.59
    SELENIUM_US = 78.971
    MANGANESE_US = 54.938

    # --- µg/L → µmol/L (or nmol/L for Hg) conversions ---
    lead_umolL = (lbxpb * 10.0 / LEAD_US) if lbxpb is not None else None       # µg/dL → µmol/L
    cadmium_umolL = (lbxcd / CADMIUM_US) if lbxcd is not None else None        # µg/L → µmol/L
    mercury_nmolL = (lbxthg * 1000.0 / MERCURY_US) if lbxthg is not None else None  # µg/L → nmol/L
    selenium_umolL = (lbxbse / SELENIUM_US) if lbxbse is not None else None    # µg/L → µmol/L
    manganese_umolL = (lbxbmn / MANGANESE_US) if lbxbmn is not None else None  # µg/L → µmol/L

    return {
        "RIDAGEMN": age_months,
        "RIAGENDR": gender_code,
        "RIDAGEYR": age_years,
        "RIDEXPRG": int(input.get("pregnancyStatus") or 0),
        "RHQ131": 1 if int(input.get("pregnancyCount", 0) or 0) else 2,

        # --- Converted SI fields (NHANES-style) ---
        "LBDBPBSI": lead_umolL,
        "LBDBCDSI": cadmium_umolL,
        "LBDTHGSI": mercury_nmolL,
        "LBDBSESI": selenium_umolL,
        "LBDBMNSI": manganese_umolL,

        # --- Also keep raw LBX fields (for models that use them directly) ---
        "LBXBPB": lbxpb,
        "LBXBCD": lbxcd,
        "LBXTHG": lbxthg,
        "LBXBSE": lbxbse,
        "LBXBMN": lbxbmn,

        # --- Meta & demographic info ---
        "BMXBMI": input.get("bmi"),
        "RHQ031": input.get("vaginalDeliveries"),
        "RHQ160": int(input.get("pregnancyCount", 0) or 0),
        "RHQ200": None,
        "is_menopausal": None,
        "BMDSADCM": None,
        "DMDMARTL": marital_code,
        "RHD280": 1 if input.get("hadHysterectomy") else 2,
        "RHQ540": 1 if input.get("everUsedFemaleHormones") else 2,
        "RHQ305": 1 if input.get("ovariesRemoved") else 2,
        "RHQ060": 1 if input.get("triedYearPregnant") else 2,
        "RHQ420": 1 if input.get("everUsedBirthControlPills") else 2,
        "RIDRETH3": None,
        "DMDBORN4": None,
        "WTSH2YR": None,
        "RHQ078": 1 if input.get("triedYearPregnant") else 2,
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

def map_infertility_features(input: Dict) -> Dict:
    features = map_common_features(input)
    # --- Final order as model expects ---
    tempdf = {col: features.get(col) for col in COLUMN_ORDERS["infertility"]}
    tempdf = preprocess_infertility_for_model(tempdf)
    print("="*40)
    print("Temp DF before preprocessing:", tempdf.columns)
    print("="*40)
    return tempdf

# --- Mapper registry ---
FEATURE_MAPPERS = {
    "hormone_testosterone": map_testosterone_features,
    "hormone_estradiol": map_estradiol_features,
    "hormone_shbg": map_shbg_features,
    "menopause": map_menopause_features,
    "menstrual": map_menstrual_features,
    "infertility": map_infertility_features,
}

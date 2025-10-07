from typing import Dict

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
    "menopause": [   'RIDAGEYR', 'RHQ166', 'LBXBPB', 'RHQ420',
    'LBXBCD', 'RHQ074', 'RHQ160', 'LBXBMN',
    'LBXTHG', 'LBXBSE'],

    "menstrual": ['RIDAGEYR', 'RHD280', 'RHQ166', 'RHQ540',
    'RHQ305', 'DMDMARTL', 'LBXBPB', 'LBXBCD', 'LBXTHG', 'LBXBSE', 'LBXBMN']
}

# --- Common mapper ---
def map_common_features(input: Dict) -> Dict:
    """Extract shared features from the API input into NHANES-style codes."""
    # age_months = input.get("ageYears", 0) * 12 + input.get("ageMonths", 0)
    age_months = input.get("ageMonths", 0)
    age_years = input.get("ageYears", 0)

    gender = input.get("gender")
    gender_code = 1 if gender and gender.lower() == "male" else 2 if gender and gender.lower() == "female" else None


    blood = input.get("bloodMetals", [{}])[0]  # take first record if exists

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
    return {col: features.get(col) for col in COLUMN_ORDERS["menopause"]}

def map_menstrual_features(input: Dict) -> Dict:
    features = map_common_features(input)
    return {col: features.get(col) for col in COLUMN_ORDERS["menstrual"]}


# --- Mapper registry ---
FEATURE_MAPPERS = {
    "hormone_testosterone": map_testosterone_features,
    "hormone_estradiol": map_estradiol_features,
    "hormone_shbg": map_shbg_features,
    "menopause": map_menopause_features,
    "menstrual": map_menstrual_features,
}

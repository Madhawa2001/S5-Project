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
    ]
}

# --- Common mapper ---
def map_common_features(input: Dict) -> Dict:
    """Extract shared features from the API input into NHANES-style codes."""
    age_months = input.get("ageYears", 0) * 12 + input.get("ageMonths", 0)

    gender = input.get("gender")
    gender_code = 1 if gender and gender.lower() == "male" else 2 if gender and gender.lower() == "female" else None


    blood = input.get("bloodMetals", [{}])[0]  # take first record if exists

    return {
        "RIDAGEMN": age_months,                            # Age in months
        "RIAGENDR": gender_code,                           # Gender
        "RIDEXPRG": int(input.get("pregnancyStatus") or 0),  # Pregnant yes/no
        "RHQ131": int(input.get("pregnancyCount", 0) or 0),          # Pregnancy count
        "LBDBPBSI": blood.get("lead_umolL"),               # Lead
        "LBDBCDSI": blood.get("cadmium_umolL"),            # Cadmium
        "LBDTHGSI": blood.get("mercury_umolL"),            # Mercury
        "LBDBSESI": blood.get("selenium_umolL"),           # Selenium
        "LBDBMNSI": blood.get("manganese_umolL"),          # Manganese
        "BMXBMI": input.get("bmi"),                                    # TODO: compute if you have weight+height
        # Extra placeholders for other models
        "RHQ031": None,
        "RHQ160": None,
        "RHQ200": None,
        "is_menopausal": None,
        "BMDSADCM": None,
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

# --- Mapper registry ---
FEATURE_MAPPERS = {
    "hormone_testosterone": map_testosterone_features,
    "hormone_estradiol": map_estradiol_features,
    "hormone_shbg": map_shbg_features,
}

import pandas as pd
import numpy as np

def preprocess_infertility_for_model(raw_input):
    """
    Prepares raw NHANES reproductive/metal record(s) for infertility model prediction.
    Works safely with a single record (dict) or multi-row DataFrame.

    Returns:
        X (pd.DataFrame): fully preprocessed, model-ready feature DataFrame
    """

    # ---------- ACCEPT BOTH SINGLE RECORD OR DF ----------
    if isinstance(raw_input, dict):
        df = pd.DataFrame([raw_input])
    elif isinstance(raw_input, pd.DataFrame):
        df = raw_input.copy()
    else:
        raise ValueError("Input must be a dict or pandas DataFrame.")

    # ---------- COLUMN MAP ----------
    col_map = {
        'WTSH2YR': 'Blood metal weights',
        'LBXBPB': 'lead_ugdl',
        'LBDBPBSI': 'lead2',
        'LBXBCD': 'cadmium_ugl',
        'LBDBCDSI': 'cadmium2',
        'LBXTHG': 'mercury_ugl',
        'LBDTHGSI': 'mercury2',
        'LBXBSE': 'selenium_ugl',
        'LBDBSESI': 'selenium2',
        'LBXBMN': 'manganese_ugl',
        'LBDBMNSI': 'manganese2',
        'RHQ031': 'regular_periods',
        'RHQ060': 'last_period_age',
        'RHQ078': 'pelvic_infection',
        'RHD280': 'hysterectomy',
        'RHQ420': 'birth_control',
        'RHQ540': 'female_hormones',
        'RIDAGEYR': 'age_years',
        'RIDRETH3': 'race',
        'DMDBORN4': 'country_birth',
        'DMDMARTL': 'marital_status'
    }
    df.rename(columns=col_map, inplace=True)

    # ---------- FORCE NUMERIC CONVERSION ----------
    # Convert all metals and numeric fields to float safely
    possible_numeric = [
        'lead_ugdl', 'cadmium_ugl', 'mercury_ugl', 'selenium_ugl', 'manganese_ugl',
        'regular_periods', 'pelvic_infection', 'hysterectomy', 'birth_control', 'female_hormones',
        'age_years', 'race', 'country_birth', 'marital_status'
    ]
    for col in possible_numeric:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # ---------- LLOD IMPUTATION ----------
    SQRT2 = np.sqrt(2)
    metal_llod1 = {'lead': 0.05, 'cadmium': 0.07, 'mercury': 0.2, 'selenium': 59.35, 'manganese': 2.21}
    for metal, llod in metal_llod1.items():
        col = f"{metal}_ugl" if f"{metal}_ugl" in df.columns else f"{metal}_ugdl"
        if col in df.columns:
            df[col] = df[col].fillna(llod / SQRT2)

    # ---------- RISK ENCODING ----------
    thresholds = {
        'lead_ugdl': {'low': 1.0, 'medium': 2.0},
        'cadmium_ugl': {'low': 0.3, 'medium': 0.5},
        'mercury_ugl': {'low': 1.0, 'medium': 3.0},
        'selenium_ugl': {'low': 120, 'medium': 180},
        'manganese_ugl': {'low': 8.0, 'medium': 12.0},
    }

    for metal, t in thresholds.items():
        if metal in df.columns:
            cat_col = metal.replace('_ugdl', '').replace('_ugl', '') + '_risk'
            df[cat_col] = pd.cut(
                df[metal],
                bins=[-np.inf, t['low'], t['medium'], np.inf],
                labels=[0, 1, 2]
            ).astype(float).fillna(0).astype(int)
        else:
            df[cat_col] = 0

    # ---------- DERIVED FEATURES ----------
    for col in ['lead_risk', 'cadmium_risk', 'mercury_risk', 'selenium_risk', 'manganese_risk']:
        if col not in df.columns:
            df[col] = 0

    df['toxic_risk_score'] = df[['lead_risk', 'cadmium_risk', 'mercury_risk']].sum(axis=1)
    df['multi_high_risk'] = ((df[['lead_risk', 'cadmium_risk', 'mercury_risk']] == 2).sum(axis=1) >= 2).astype(int)
    df['risk_imbalance'] = (
        ((df['lead_risk'] == 2).astype(int) + (df['cadmium_risk'] == 2).astype(int) + (df['mercury_risk'] == 2).astype(int))
        - ((df['selenium_risk'] == 0).astype(int) + (df['manganese_risk'] == 0).astype(int))
    )
    df['high_lead_cadmium'] = ((df['lead_risk'] == 2) & (df['cadmium_risk'] == 2)).astype(int)
    df['low_selenium_high_toxics'] = ((df['selenium_risk'] == 0) & (df['toxic_risk_score'] >= 4)).astype(int)

    # ---------- IMPUTE NON-METAL CATEGORICAL NUMERIC ----------
    fill_zeros = [
        'regular_periods', 'pelvic_infection', 'hysterectomy',
        'birth_control', 'female_hormones', 'age_years',
        'race', 'country_birth', 'marital_status'
    ]
    for col in fill_zeros:
        if col in df.columns:
            df[col] = df[col].fillna(0)

    # ---------- SELECT FINAL FEATURE SET ----------
    # feature_cols = [
    #     'lead_ugdl', 'cadmium_ugl', 'mercury_ugl', 'selenium_ugl', 'manganese_ugl',
    #     'regular_periods', 'pelvic_infection', 'hysterectomy', 'birth_control', 'female_hormones',
    #     'age_years', 'race', 'country_birth', 'marital_status',
    #     'lead_risk', 'cadmium_risk', 'mercury_risk', 'selenium_risk', 'manganese_risk',
    #     'toxic_risk_score', 'multi_high_risk', 'risk_imbalance',
    #     'high_lead_cadmium', 'low_selenium_high_toxics'
    # ]
    feature_cols = ['Blood metal weights', 'regular_periods', 'last_period_age', 'pelvic_infection',
                     'hysterectomy', 'birth_control', 'female_hormones', 'age_years', 'race', 'country_birth',
                     'marital_status', 'lead_risk', 'cadmium_risk', 'mercury_risk', 'selenium_risk', 'manganese_risk',
                     'toxic_risk_score', 'multi_high_risk', 'risk_imbalance', 'high_lead_cadmium', 'low_selenium_high_toxics']

    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0

    X = df[feature_cols].astype(float)
    # print("="*40)
    # print("Temp DF before preprocessing:", X.columns)
    # print("="*40)

    # Always return a DataFrame even if single record
    return X.reset_index(drop=True)
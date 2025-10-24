# Infertility & Heavy Metal Exposure Analysis

Predictive modeling and association rule mining on NHANES data to explore relationships between heavy metal exposure and reproductive health outcomes.

## Datasets

- **TST_I**: Hormone levels (testosterone, estradiol, SHBG)
- **PBCD_I**: Heavy metals (lead, cadmium, mercury, selenium, manganese)
- **RHQ_I**: Reproductive health questionnaire
- **DEMO_I**: Demographics (age, race, income, education)

## Quick Start

```bash
# Setup environment
./setup.sh

# Or manually:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run data merging
jupyter notebook datamerge.ipynb

# Run association rule mining
jupyter notebook apriori.ipynb

```

## 📁 Project Structure

```
├── dataset/              # Raw NHANES .xpt files
├── datasets-csv/         # Converted & cleaned CSVs
├── datamerge.ipynb       # Data preprocessing & merging
├── apriori.ipynb         # Association rule mining
├── infertility.csv       # Merged reproductive health dataset
└── hormone_levels.csv    # Merged hormone disruption dataset
```

## Data Merging Strategy

- **Inner joins**: Guarantee complete exposure-outcome data (metals + hormones/infertility)
- **Left joins**: Preserve sample size when adding demographics (allows imputation)

## Analysis Methods

1. **Association Rule Mining** (Apriori algorithm)
   - Discovers hidden patterns between metal exposure and infertility
   - Generates IF-THEN rules with lift/confidence metrics

2. **Predictive Modeling** (XGBoost, Random Forest)
   - Classifies infertility risk based on metal exposure profiles
   - SMOTE for handling class imbalance


## Technologies

- Python
- pandas, numpy, scikit-learn
- mlxtend (Apriori), xgboost
- pyreadstat (NHANES data)

## Citation

Data source: NHANES 2015-2016 Cycle
- https://wwwn.cdc.gov/nchs/nhanes/

## 👤 Author

Sathsarani Amarasinghe - 220023U
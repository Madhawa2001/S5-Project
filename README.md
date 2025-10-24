# ReproSight: Environmental Toxins & Reproductive Health Analytics

## Project Overview

ReproSight is a comprehensive clinical analytics platform that investigates the relationship between environmental toxin exposure (particularly heavy metals) and human reproductive health outcomes. Using machine learning and data visualization, this project aims to uncover hidden patterns and provide predictive insights for clinicians and researchers.

## Project Structure

```
S5-Project/
├── backend/
├── frontend/
├── ml-service/
├── dashboard/                              
├── Models/                                # Machine learning models
│   ├── Hormone level prediciton/         
│   ├── infertility prediction/           
│   ├── Menopause prediction/             
│   └── Menstrual prediction/             
└── README.md                              
```
## Backend Services
	-	Developed using FastAPI (for ML service) and Node.js (Express) (for core logic and APIs).
	-	Uses PostgreSQL with Prisma ORM for relational data management.
	-	Implements JWT Authentication and role-based access for security.
	-	Hosts ML models as microservices for scalability and modularity.
	-	Deployed on Railway for reliable cloud integration.

## Frontend Service
	-	Built with React + Vite for a fast, modular, and responsive interface.
	-	Styled using Tailwind CSS for clean and consistent UI.
	-	Implements Axios for secure API requests and React Router for navigation.
	-	Provides separate dashboards for Admin, Doctor, and Nurse roles.
	-	Deployed on Netlify for stable and global accessibility.

## 🔬 Models & Features

### 1. **Infertility Risk Prediction** 
**Location**: `Models/infertility prediction/`

Predicts infertility risk based on heavy metal exposure, hormonal levels, and demographic factors.

### 2. **Hormone Level Prediction** 
**Location**: `Models/Hormone level prediciton/`

Predicts reproductive hormone levels (testosterone, estradiol, SHBG) based on environmental metal exposure.

### 3. **Menopause Onset Prediction** 
**Location**: `Models/Menopause prediction/` 

Will predict age of menopause onset based on:
- Environmental toxin exposure history
- Hormonal profiles over time
- Demographic and genetic factors
- Lifestyle variables

### 4. **Menstrual Cycle Prediction** 
**Location**: `Models/Menstrual prediction/` 

Will predict menstrual regularity and cycle patterns:
- Regular vs. irregular cycle classification
- Age of menarche (first period) prediction
- Cycle length prediction
- Toxin impact on menstrual health

## Interactive Dashboard

The **ReproSight Analytics Hub** (`dashboard/app.py`) provides two user interfaces:

### **Key Insights Mode** 
Narrative-driven visualizations with clinical interpretations:

1. **Hormonal Patterns**
   - Metal vs. Hormone correlation heatmap
   - Interactive scatter plots with trendlines
   
2. **Fertility Analysis**
   - Metal exposure comparison: Fertile vs. Infertile groups
   - Infertility rate by age group

3. **Menstrual Cycle Insights**
   - Raincloud plots for regular vs. irregular cycles
   - Metal exposure impact on age of first period

4. **Menopause Trends**
   - Toxin exposure vs. menopause age scatter plots
   - Early menopause risk factors

### **Explore Dataset Mode** 

1. **Data Overview**
   - Dataset shape, size, and summary statistics
   - Missing values heatmap
   - Data type inspection

2. **Univariate Explorer**
   - Histograms for numerical variables
   - Bar charts for categorical variables

3. **Bivariate Relationship Explorer**
   - Scatter plots with Pearson correlation
   - Box plots for categorical vs. numerical
   - Optional color coding by third variable

4. **Correlation Matrix**
   - Interactive heatmap with filtering
   - Threshold-based correlation display


## Datasets

### Source: NHANES (National Health and Nutrition Examination Survey)

All datasets are from NHANES 2015-2016 cycle.

| Dataset | Description | Key Variables |
|---------|-------------|---------------|
| **DEMO_I** | Demographics | Age, gender, race, education, income |
| **RHQ_I** | Reproductive Health | Infertility duration, pregnancy history, menopause status |
| **TST_I** | Testosterone & Hormones | Testosterone, estradiol, SHBG levels |
| **PBCD_I** | Blood Metals | Lead, cadmium, mercury, selenium, manganese |



## Technologies Used

### Frontend
	-	React + Vite – for fast, modular, and modern UI development.
	-	Tailwind CSS – for responsive and consistent styling.
	-	Axios – for secure API communication.
	-	React Router – for role-based navigation.
	-	Netlify – for frontend hosting and continuous deployment.

### Backend
	-	Node.js (Express) – for REST API development and business logic.
	-	FastAPI – for ML model serving and API endpoints.
	-	PostgreSQL – for relational data storage.
	-	Prisma ORM – for type-safe database operations and schema management.
	-	JWT Authentication – for secure user login and role-based access.
	-	Railway – for backend and database hosting.

### Machine Learning & Data Science
	-	Python – for data preprocessing, modeling, and service logic.
	-	scikit-learn, XGBoost, LightGBM – for model training and evaluation.
	-	SHAP – for explainable AI and model interpretation.
	-	Pandas, NumPy, Matplotlib, Seaborn – for analysis and visualization.
	-	Streamlit – for building the interactive EDA dashboard.

### Testing & Tools
	-	Postman – for API testing and debugging.
	-	Selenium – for frontend automation testing.
	-	GitHub – for version control and team collaboration.
   
## Team
- Sathsarani Amarasinghe
- Madhawa Abhayawickrama
- Abishan Vasanthan

# models/joblib_model.py
import joblib
import pandas as pd
from .base_model import BaseModel

class JoblibModel(BaseModel):
    def __init__(self, path, preprocess_fn):
        self.model = joblib.load(path)
        self.preprocess_fn = preprocess_fn

    def preprocess(self, raw_data: dict) -> pd.DataFrame:
        return self.preprocess_fn(raw_data)

    def predict(self, df: pd.DataFrame):
        return self.model.predict(df)

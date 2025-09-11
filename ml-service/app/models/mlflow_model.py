# models/mlflow_model.py
import mlflow.pyfunc
import pandas as pd
from .base_model import BaseModel

class MLflowModel(BaseModel):
    def __init__(self, path, preprocess_fn):
        self.model = mlflow.pyfunc.load_model(path)
        self.preprocess_fn = preprocess_fn

    def preprocess(self, raw_data: dict) -> pd.DataFrame:
        return self.preprocess_fn(raw_data)

    def predict(self, df: pd.DataFrame):
        return self.model.predict(df)

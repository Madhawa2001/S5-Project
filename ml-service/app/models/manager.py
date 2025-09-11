from .mlflow_model import MLflowModel
from .joblib_model import JoblibModel
from pipelines.preprocess_diabetes import preprocess as preprocess_diabetes
from pipelines.preprocess_cardiac import preprocess as preprocess_cardiac

class ModelManager:
    def __init__(self):
        self.models = {
            "diabetes": JoblibModel("models/diabetes.pkl", preprocess_diabetes),
            "cardiac": MLflowModel("models/mlflow_cardiac", preprocess_cardiac),
        }

    def get_model(self, name):
        if name not in self.models:
            raise ValueError(f"Model {name} not found")
        return self.models[name]

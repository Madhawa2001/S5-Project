from abc import ABC, abstractmethod
import pandas as pd

class BaseModel(ABC):
    @abstractmethod
    def predict(self, df: pd.DataFrame):
        pass

    @abstractmethod
    def preprocess(self, raw_data: dict) -> pd.DataFrame:
        pass

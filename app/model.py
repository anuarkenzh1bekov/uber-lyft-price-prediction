import joblib
import pandas as pd
from pathlib import Path

MODEL_PATH = Path(__file__).parent / 'uber_price_model_v1.pkl'
artifact = joblib.load(MODEL_PATH)

model = artifact['model']
scaler = artifact['scaler']
num_cols = artifact['num_cols']
feature_columns = artifact['feature_columns']

def predict_price(distance: float, surge_multiplier: float, name: str) -> float:
    row = pd.DataFrame([[0] * len(feature_columns)], columns=feature_columns)
    row["distance"] = distance
    row["surge_multiplier"] = surge_multiplier

    dummy_col = f"name_{name}"
    if dummy_col in row.columns:
        row[dummy_col] = 1

    row[num_cols] = scaler.transform(row[num_cols])
    return float(model.predict(row)[0])

if __name__ == '__main__':
    print(predict_price(1.5, 1.5, "UberX"))
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.schemas import PredictResponse, PredictRequest
from app.model import predict_price, feature_columns

app = FastAPI(title="Uber Price Prediction API")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    price = predict_price(req.distance, req.surge_multiplier, req.name)
    return PredictResponse(price=price)

@app.get("/ride-types")
def get_ride_types():
    return {"types": [c.replace("name_", "") for c in feature_columns if c.startswith("name_")]}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
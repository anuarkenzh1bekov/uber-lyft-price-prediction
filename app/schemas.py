from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    distance: float = Field(..., gt=0, description="distance in miles")
    surge_multiplier: float = Field(1.0, ge=1.0, le=3.0)
    name: str = Field(..., description="Type of trip")

class PredictResponse(BaseModel):
    price: float
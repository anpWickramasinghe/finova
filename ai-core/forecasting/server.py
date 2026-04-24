from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import uvicorn
from db import fetch_historical_cash_flow
from agent import CashFlowForecaster

app = FastAPI(title="Finova Forecasting API")

# Enable CORS for backend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to backend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionResult(BaseModel):
    date: str
    predicted_flow: float
    type: str

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/predict", response_model=List[PredictionResult])
async def predict_cash_flow(days: int = 30):
    try:
        # 1. Fetch historical data
        df = await fetch_historical_cash_flow()
        
        # 2. Initialize forecaster
        forecaster = CashFlowForecaster(df)
        
        # 3. Train model
        trained = forecaster.train()
        
        # 4. Generate predictions
        predictions = forecaster.predict(days=days)
        
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)

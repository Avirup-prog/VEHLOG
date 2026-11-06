from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import os

app = FastAPI(title="AI Logistics Prediction API", description="Microservice for Delivery ML Models")

# Allow CORS so our Node.js Backend or React Frontend can call this directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model and Encoders
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "eta_rf_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "models", "label_encoders.pkl")

try:
    model = joblib.load(MODEL_PATH)
    label_encoders = joblib.load(ENCODER_PATH)
    print("[SUCCESS] AI Model and Encoders loaded successfully.")
except Exception as e:
    print(f"[ERROR] Error loading models: {e}")
    model = None

# Define the expected JSON input structure using Pydantic
class ETARequest(BaseModel):
    distance_km: float
    restaurant_preparation_time_minutes: float
    delivery_partner_experience_months: float
    weather: str
    traffic_level: str

@app.get("/")
def read_root():
    return {"status": "AI Engine Microservice is running!", "model_loaded": model is not None}

@app.post("/predict_eta")
def predict_eta(request: ETARequest):
    if not model:
        raise HTTPException(status_code=500, detail="AI Model is not loaded on the server.")
    
    try:
        # Encode categorical variables using the saved encoders
        weather = request.weather
        traffic = request.traffic_level
        
        # Safe encoding: If the UI sends an unknown weather type, default to 0 to prevent crashes
        weather_encoded = label_encoders['weather'].transform([weather])[0] if weather in label_encoders['weather'].classes_ else 0
        traffic_encoded = label_encoders['traffic_level'].transform([traffic])[0] if traffic in label_encoders['traffic_level'].classes_ else 0

        # Create a DataFrame exactly how the model was trained
        input_data = pd.DataFrame([{
            'distance_km': request.distance_km,
            'restaurant_preparation_time_minutes': request.restaurant_preparation_time_minutes,
            'delivery_partner_experience_months': request.delivery_partner_experience_months,
            'weather': weather_encoded,
            'traffic_level': traffic_encoded
        }])

        # Predict the ETA
        prediction = model.predict(input_data)[0]
        
        return {
            "predicted_eta_minutes": round(prediction, 1),
            "inputs_received": request.dict(),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

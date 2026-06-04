from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import pandas as pd
import joblib
import tensorflow as tf
import os

app = FastAPI(title="Travel Recommendation ML API")

# Allow CORS for Next.js frontend/backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths to models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "travel_recommendation_model.keras")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "preprocessor.joblib")
HOTEL_SCALER_PATH = os.path.join(BASE_DIR, "hotel_price_scaler.joblib")
ATTRACTION_SCALER_PATH = os.path.join(BASE_DIR, "attraction_ticket_price_scaler.joblib")

# Global variables for loaded models
model = None
preprocessor = None
hotel_scaler = None
attraction_scaler = None

@app.on_event("startup")
async def load_models():
    global model, preprocessor, hotel_scaler, attraction_scaler
    try:
        # Load Keras model
        if os.path.exists(MODEL_PATH):
            model = tf.keras.models.load_model(MODEL_PATH)
            print(f"Loaded Keras model from {MODEL_PATH}")
        else:
            # Fallback to .h5 if .keras doesn't exist
            h5_path = os.path.join(BASE_DIR, "travel_recommendation_model.h5")
            if os.path.exists(h5_path):
                model = tf.keras.models.load_model(h5_path)
                print(f"Loaded Keras model from {h5_path}")
            else:
                print("WARNING: Could not find Keras model file!")

        # Load Scalers and Preprocessor
        if os.path.exists(PREPROCESSOR_PATH):
            preprocessor = joblib.load(PREPROCESSOR_PATH)
            print("Loaded preprocessor")
        if os.path.exists(HOTEL_SCALER_PATH):
            hotel_scaler = joblib.load(HOTEL_SCALER_PATH)
            print("Loaded hotel scaler")
        if os.path.exists(ATTRACTION_SCALER_PATH):
            attraction_scaler = joblib.load(ATTRACTION_SCALER_PATH)
            print("Loaded attraction scaler")

    except Exception as e:
        print(f"Error loading models: {e}")

class RecommendationRequest(BaseModel):
    # This assumes a dynamic set of features. 
    # If you know the exact features, you can replace Dict[str, Any] with explicit fields
    # e.g., destination: str, budget: float, days: int, etc.
    features: List[Dict[str, Any]]

@app.get("/health")
def health_check():
    return {"status": "healthy", "models_loaded": model is not None}

@app.post("/recommend")
def get_recommendation(request: RecommendationRequest):
    if model is None or preprocessor is None:
        raise HTTPException(status_code=500, detail="Models are not fully loaded.")
    
    try:
        # 1. Convert input JSON to Pandas DataFrame (as expected by scikit-learn pipelines)
        df = pd.DataFrame(request.features)
        
        # 2. Preprocess features
        X_processed = preprocessor.transform(df)
        
        # 3. Predict using Keras model
        predictions = model.predict(X_processed)
        
        # 4. Depending on how your model outputs data, you might need to inverse transform it.
        # Assuming predictions is a 2D array and we might have multiple outputs.
        # This part depends heavily on how your model was trained. 
        # Here we provide a generic output structure.
        
        # Example if you need to use the scalers on the output:
        # If output 0 is hotel price and output 1 is attraction price:
        # hotel_price = hotel_scaler.inverse_transform(predictions[:, 0].reshape(-1, 1))
        # attraction_price = attraction_scaler.inverse_transform(predictions[:, 1].reshape(-1, 1))
        
        # We will return the raw predictions for now so you can see what it outputs.
        return {
            "status": "success",
            "predictions": predictions.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

import os
import pandas as pd
import joblib
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np

# Initialize FastAPI app
app = FastAPI(title="Travel Recommendation ML API")

# Define Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "travel_recommendation_model.keras")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "preprocessor.joblib")
HOTEL_SCALER_PATH = os.path.join(BASE_DIR, "hotel_price_scaler.joblib")
ATTRACTION_SCALER_PATH = os.path.join(BASE_DIR, "attraction_ticket_price_scaler.joblib")

DATASET_1 = os.path.join(BASE_DIR, "indian_travel_companion_dataset.csv")
DATASET_2 = os.path.join(BASE_DIR, "bhubaneswar_origin_travel_dataset.csv")

# Global Variables
model = None
preprocessor = None
hotel_scaler = None
attraction_scaler = None
combined_df = pd.DataFrame()

@app.on_event("startup")
async def startup_event():
    global model, preprocessor, hotel_scaler, attraction_scaler, combined_df
    
    # 1. Load Datasets
    try:
        df1 = pd.read_csv(DATASET_1) if os.path.exists(DATASET_1) else pd.DataFrame()
        df2 = pd.read_csv(DATASET_2) if os.path.exists(DATASET_2) else pd.DataFrame()
        combined_df = pd.concat([df1, df2], ignore_index=True)
        print(f"Loaded datasets. Combined shape: {combined_df.shape}")
    except Exception as e:
        print(f"Warning: Could not load datasets: {e}")

    # 2. Load Models and Scalers
    try:
        if os.path.exists(MODEL_PATH):
            model = tf.keras.models.load_model(MODEL_PATH)
            print("Loaded Keras model.")
        
        if os.path.exists(PREPROCESSOR_PATH):
            preprocessor = joblib.load(PREPROCESSOR_PATH)
            print("Loaded preprocessor.")
            
        if os.path.exists(HOTEL_SCALER_PATH):
            hotel_scaler = joblib.load(HOTEL_SCALER_PATH)
            
        if os.path.exists(ATTRACTION_SCALER_PATH):
            attraction_scaler = joblib.load(ATTRACTION_SCALER_PATH)
            
    except Exception as e:
        print(f"Warning: Could not load ML artifacts: {e}")

# Request Model
class PredictionRequest(BaseModel):
    origin: str
    destination: str
    total_budget: float
    duration_days: int

@app.post("/predict")
async def predict_trip(req: PredictionRequest):
    budget_per_day = req.total_budget / req.duration_days if req.duration_days > 0 else 0

    # 1. Preprocess & Predict
    predicted_hotel_price = 0
    predicted_attractions = ""
    transport_mode = "Flight" # default
    predicted_ticket_cost = 0

    try:
        # Create input df matching training features (Added Budget_Per_Day)
        input_data = pd.DataFrame([{
            "Origin": req.origin,
            "Destination": req.destination,
            "Total_Budget_INR": req.total_budget,
            "Duration_Days": req.duration_days,
            "Budget_Per_Day": budget_per_day
        }])

        if preprocessor and model:
            X_processed = preprocessor.transform(input_data)
            preds = model.predict(X_processed)
            
            # Extract predictions based on multi-output model architecture (5 outputs)
            if isinstance(preds, list) and len(preds) >= 4:
                # preds[0] = transport (classification)
                # preds[1] = hotel_price (regression)
                # preds[2] = attraction (classification)
                # preds[3] = ticket_price (regression)
                # preds[4] = hotel_name (classification)
                
                # Hotel Price extraction
                hotel_price_pred_scaled = preds[1][0]
                if hotel_scaler:
                    import numpy as np
                    raw_hotel = hotel_scaler.inverse_transform(np.array(hotel_price_pred_scaled).reshape(-1, 1))[0][0]
                else:
                    raw_hotel = hotel_price_pred_scaled[0] if isinstance(hotel_price_pred_scaled, (list, np.ndarray)) else hotel_price_pred_scaled
                predicted_hotel_price = max(0, float(raw_hotel))
                
                # Ticket Cost extraction
                ticket_pred_scaled = preds[3][0]
                if attraction_scaler:
                    import numpy as np
                    raw_ticket = attraction_scaler.inverse_transform(np.array(ticket_pred_scaled).reshape(-1, 1))[0][0]
                else:
                    raw_ticket = ticket_pred_scaled[0] if isinstance(ticket_pred_scaled, (list, np.ndarray)) else ticket_pred_scaled
                predicted_ticket_cost = max(0, float(raw_ticket))
            else:
                print("Warning: Model didn't return expected list of 5 outputs. Falling back.")
                predicted_hotel_price = budget_per_day * 0.4
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Model prediction failed or format mismatch: {e}")
        # Fallback to dataset averages if model prediction fails
        route_data = combined_df[(combined_df['Origin'].str.lower() == req.origin.lower()) & 
                                 (combined_df['Destination'].str.lower() == req.destination.lower())]
        if not route_data.empty:
            predicted_hotel_price = route_data['Hotel_Price_Per_Night_INR'].mean()
        else:
            predicted_hotel_price = budget_per_day * 0.4

    # --- Heuristics ---

    # Heuristic 1: Transport
    if req.total_budget < 8000 or budget_per_day < 1000:
        transport_mode = "Train"
    elif req.total_budget >= 25000 or budget_per_day >= 4000:
        transport_mode = "Flight"
    else:
        # Try to find common transport from dataset
        route_data = combined_df[(combined_df['Origin'].str.lower() == req.origin.lower()) & 
                                 (combined_df['Destination'].str.lower() == req.destination.lower())]
        if not route_data.empty:
            transport_mode = route_data['Recommended_Transport'].mode()[0]
        else:
            transport_mode = "Flight"

    # Heuristic 2: Cap hotel price
    cap_hotel = budget_per_day * 0.5
    
    # Bug fix: If model predicts 0 or negative due to extreme features, set a realistic minimum
    realistic_min_hotel = min(800, cap_hotel) if budget_per_day > 0 else 0
    final_hotel_price = max(min(predicted_hotel_price, cap_hotel), realistic_min_hotel)
    
    # Get dataset subset for this specific route to be used in heuristics
    route_data = combined_df[(combined_df['Origin'].str.lower() == req.origin.lower()) & 
                             (combined_df['Destination'].str.lower() == req.destination.lower())]

    # Heuristic 4: Dynamic Selection using dataframe
    final_hotel_name = "Budget Backpacker Hostel"
    if not route_data.empty:
        # Filter updated_df to find hotels within the budget for the specific route
        eligible_hotels = route_data[route_data['Hotel_Price_Per_Night_INR'] <= final_hotel_price].copy()
        
        if not eligible_hotels.empty:
            if 'Hotel_User_Rating' in eligible_hotels.columns:
                best_hotel_row = eligible_hotels.loc[eligible_hotels['Hotel_User_Rating'].idxmax()]
                final_hotel_name = best_hotel_row['Hotel_Name']
            else:
                final_hotel_name = eligible_hotels.iloc[0]['Hotel_Name']
        else:
            final_hotel_name = route_data.iloc[0]['Hotel_Name'] # fallback to first if none fit

    # Heuristic 3: Attractions & Ticket Cost
    predicted_top_attractions = ""
    final_ticket_cost = predicted_ticket_cost

    if not route_data.empty:
        # We find the most common attraction for this route
        predicted_top_attractions = route_data['Top_Attractions'].mode()[0]
        # Match ticket cost
        exact_match = route_data[route_data['Top_Attractions'] == predicted_top_attractions]
        if not exact_match.empty:
            final_ticket_cost = exact_match['Total_Attraction_Ticket_Cost_INR'].mean()
        else:
            final_ticket_cost = min(max(budget_per_day * 0.10, 300), 2000)
    else:
        predicted_top_attractions = f"Popular Sites in {req.destination}"
        final_ticket_cost = min(max(budget_per_day * 0.10, 300), 2000)

    # --- Additional Context ---
    alternative_hotels = []
    alternative_attractions = []

    if not route_data.empty:
        # Find hotels within +/- 20% of final_hotel_price
        min_hotel = final_hotel_price * 0.8
        max_hotel = final_hotel_price * 1.2
        alt_hotels_df = route_data[(route_data['Hotel_Price_Per_Night_INR'] >= min_hotel) & 
                                   (route_data['Hotel_Price_Per_Night_INR'] <= max_hotel)]
        
        # Deduplicate by name and get up to 5
        alt_hotels = alt_hotels_df['Hotel_Name'].unique().tolist()
        alternative_hotels = alt_hotels[:5]

        # Alternative attractions
        alt_attr = route_data['Top_Attractions'].unique().tolist()
        # Remove the main one
        if predicted_top_attractions in alt_attr:
            alt_attr.remove(predicted_top_attractions)
        alternative_attractions = alt_attr[:5]
    else:
        min_hotel = final_hotel_price * 0.8
        max_hotel = final_hotel_price * 1.2

    # Prepare response variables
    formatted_budget = f"{req.total_budget:,.2f}"
    formatted_bpd = f"{budget_per_day:,.2f}"
    formatted_hotel = f"{final_hotel_price:,.2f}"
    formatted_ticket = f"{final_ticket_cost:,.2f}"
    formatted_cap = f"{cap_hotel:,.2f}"
    formatted_min = f"{min_hotel:,.2f}"
    formatted_max = f"{max_hotel:,.2f}"

    alt_hotels_str = "\n".join([f"- {h}" for h in alternative_hotels]) if alternative_hotels else "None found in budget range."
    alt_attr_str = "\n".join([f"- {a}" for a in alternative_attractions]) if alternative_attractions else "None found."

    # --- Formatted Report ---
    formatted_report = f"""Processing new request: {req.origin} to {req.destination}, Budget: {formatted_budget} INR, Duration: {req.duration_days} days
Calculated Budget Per Day: {formatted_bpd} INR
--- New Prediction Results ---
Recommended Transport: {transport_mode}
Predicted Hotel Price Per Night (Capped at {formatted_cap} INR): {formatted_hotel} INR
Recommended Hotel Name: {final_hotel_name}
Top Attraction: {predicted_top_attractions}
Predicted Attraction Ticket Cost: {formatted_ticket} INR
--- Additional Context from Dataset ---
Available Hotels (within {formatted_min}-{formatted_max} INR for this route):
{alt_hotels_str}

Available Attractions for this route:
{alt_attr_str}"""

    return {
        "origin": req.origin,
        "destination": req.destination,
        "budget_per_day": budget_per_day,
        "transport": transport_mode,
        "hotel_price_per_night": final_hotel_price,
        "hotel_name": final_hotel_name,
        "top_attractions": predicted_top_attractions,
        "attraction_ticket_cost": final_ticket_cost,
        "alternative_hotels": alternative_hotels,
        "alternative_attractions": alternative_attractions,
        "formatted_report": formatted_report
    }

import os
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

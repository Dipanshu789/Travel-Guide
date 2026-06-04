import joblib
import pandas as pd
import tensorflow as tf

print("--- Preprocessor Inspection ---")
try:
    preprocessor = joblib.load('preprocessor.joblib')
    if hasattr(preprocessor, 'feature_names_in_'):
        print("Expected Features:")
        print(preprocessor.feature_names_in_)
    else:
        print("No feature_names_in_ attribute. Checking transformers...")
        print(preprocessor)
except Exception as e:
    print(f"Error loading preprocessor: {e}")

print("\n--- Model Inspection ---")
try:
    model = tf.keras.models.load_model('travel_recommendation_model.keras')
    print("Model Inputs:")
    print(model.inputs)
    print("Model Outputs:")
    print(model.outputs)
except Exception as e:
    print(f"Error loading model: {e}")

import sys
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.naive_bayes import GaussianNB
import os

def predict_all(temperature, humidity, ph, rainfall):
    try:
        # Verify dataset exists
        if not os.path.exists("SmartCrop-Dataset.csv"):
            raise FileNotFoundError("Dataset file not found. Ensure 'SmartCrop-Dataset.csv' is in the working directory.")
        
        # Load and preprocess data
        df = pd.read_csv("SmartCrop-Dataset.csv")

        # Convert all columns except 'label' to numeric
        for col in df.columns:
            if col != 'label':
                df[col] = pd.to_numeric(df[col], errors='coerce')
        df = df.dropna()  # Drop rows with NaN after conversion
        
        # NPK prediction models
        features = ['temperature', 'humidity', 'ph', 'rainfall']
        X = df[features]
        X_np = X.values
        
        # Train NPK models with numpy arrays
        model_N = RandomForestRegressor().fit(X_np, df['N'])
        model_P = RandomForestRegressor().fit(X_np, df['P'])
        model_K = RandomForestRegressor().fit(X_np, df['K'])
        
        # Predict NPK values with proper input format
        sensor_input = np.array([[temperature, humidity, ph, rainfall]])
        pred_N = model_N.predict(sensor_input)[0]
        pred_P = model_P.predict(sensor_input)[0]
        pred_K = model_K.predict(sensor_input)[0]
        
        # Crop prediction model
        crop_df = df.copy()
        
        # Remove outliers
        numeric_df = crop_df.drop(columns=['label'])  # Only numeric data for IQR
        Q1 = numeric_df.quantile(0.25)
        Q3 = numeric_df.quantile(0.75)
        IQR = Q3 - Q1

# Filter based on numeric columns only
        mask = ~((numeric_df < (Q1 - 1.5 * IQR)) | (numeric_df > (Q3 + 1.5 * IQR))).any(axis=1)
        crop_df = crop_df[mask]

        
        X_crop = crop_df.drop('label', axis=1).values  # Convert to numpy array
        y_crop = crop_df['label']
        
        model = make_pipeline(StandardScaler(), GaussianNB())
        model.fit(X_crop, y_crop)
        
        # Prepare crop prediction input with proper feature order
        new_input = np.array([[
            pred_N, 
            pred_P, 
            pred_K, 
            temperature, 
            humidity, 
            ph, 
            rainfall
        ]])
        
        # Get predictions
        prediction = model.predict(new_input)[0]
        probs = model.predict_proba(new_input)[0]
        
        # Get top 3 predictions with probabilities
        top_3 = sorted(zip(model.classes_, probs), key=lambda x: -x[1])[:3]
        
        return {
            "parameters": {
                "temperature": float(temperature),
                "humidity": float(humidity),
                "ph": float(ph),
                "rainfall": float(rainfall),
                "N": round(float(pred_N), 2),
                "P": round(float(pred_P), 2),
                "K": round(float(pred_K), 2)
            },
            "top_prediction": prediction,
            "recommendations": [
                {"crop": crop, "probability": round(float(prob), 4)}
                for crop, prob in top_3
            ]
        }
    
    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    try:
        if len(sys.argv) != 5:
            raise ValueError("Requires exactly 4 arguments: temperature humidity ph rainfall")
            
        temp = float(sys.argv[1])
        humid = float(sys.argv[2])
        ph = float(sys.argv[3])
        rain = float(sys.argv[4])
        
        result = predict_all(temp, humid, ph, rain)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

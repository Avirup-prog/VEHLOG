import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, "cleaned_delivery_dataset.csv")
MODEL_DIR = os.path.join(BASE_DIR, "ai_engine", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

print("Loading dataset for ETA Prediction...")
df = pd.read_csv(DATA_FILE)

# 1. Define our Features (Inputs) and Target (Output)
# We want to predict 'actual_delivery_time_minutes'
features = [
    'distance_km', 
    'restaurant_preparation_time_minutes', 
    'delivery_partner_experience_months',
    'weather', 
    'traffic_level'
]
target = 'actual_delivery_time_minutes'

# Drop any rows where critical data is missing
df = df.dropna(subset=[target] + features)

X = df[features].copy()
y = df[target]

print("Preprocessing and encoding categorical variables (Weather, Traffic)...")
label_encoders = {}
for col in ['weather', 'traffic_level']:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col].astype(str))
    label_encoders[col] = le

# 2. Split dataset into Training Data (80%) and Testing Data (20%)
print("Splitting data into 80% train and 20% test sets...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Initialize and Train the Machine Learning Model
print("Training Random Forest Regressor (this may take a moment)...")
# Random Forest is excellent for logistics because it handles complex, non-linear relationships well
model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# 4. Evaluate the Model's accuracy on unseen test data
print("Evaluating Model Accuracy...")
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print("-" * 30)
print(f"Mean Absolute Error (MAE): Off by +/- {mae:.2f} minutes")
print(f"R-Squared (Accuracy Score): {r2:.2f} / 1.00")
print("-" * 30)

# 5. Save the trained model to disk so our Node.js backend can use it later
print("Saving trained model and encoders to /models directory...")
joblib.dump(model, os.path.join(MODEL_DIR, 'eta_rf_model.pkl'), compress=3)
joblib.dump(label_encoders, os.path.join(MODEL_DIR, 'label_encoders.pkl'))

print("✅ AI Model Training Complete! The brain is ready.")

import pandas as pd
import numpy as np
import os

# Paths configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_FILE = os.path.join(BASE_DIR, "food_delivery_orders_dataset.csv")
OUTPUT_FILE = os.path.join(BASE_DIR, "cleaned_delivery_dataset.csv")

print(f"Loading dataset from {INPUT_FILE}...")
df = pd.read_csv(INPUT_FILE)

# Base coordinates for the cities (using major Indian cities for realism)
# City_A: Bangalore, City_B: Mysore, City_C: Chennai, City_D: Hyderabad
city_coords = {
    'City_A': (12.9716, 77.5946), 
    'City_B': (12.2958, 76.6394),
    'City_C': (13.0827, 80.2707),
    'City_D': (17.3850, 78.4867)
}

# Generate synthetic Lat/Long for Restaurants and Customers
def generate_coords(row, is_restaurant=True):
    city = row.get('city', 'City_A')
    base_lat, base_lng = city_coords.get(city, (12.9716, 77.5946))
    
    # Add a random offset for variance (approx 1-5 km radius for restaurants)
    # 1 degree lat/lng is ~111km. So 0.01 is ~1.1km.
    lat_offset = np.random.uniform(-0.05, 0.05)
    lng_offset = np.random.uniform(-0.05, 0.05)
    
    # If it's a customer, add distance logic to separate them slightly from the restaurant
    if not is_restaurant:
        lat_offset += np.random.uniform(-0.02, 0.02)
        lng_offset += np.random.uniform(-0.02, 0.02)
        
    return pd.Series([base_lat + lat_offset, base_lng + lng_offset])

print("Generating synthetic GPS coordinates for restaurants...")
df[['restaurant_lat', 'restaurant_lng']] = df.apply(lambda row: generate_coords(row, True), axis=1)

print("Generating synthetic GPS coordinates for customers...")
df[['customer_lat', 'customer_lng']] = df.apply(lambda row: generate_coords(row, False), axis=1)

# Basic Cleaning: Fill any missing values
print("Performing basic data cleaning...")
df['cancellation_reason'] = df['cancellation_reason'].fillna('None')
# Fill missing customer ratings with the median
median_rating = df['customer_rating'].median()
df['customer_rating'] = df['customer_rating'].fillna(median_rating)

print(f"Saving cleaned dataset to {OUTPUT_FILE}...")
df.to_csv(OUTPUT_FILE, index=False)
print("Data Preprocessing Complete! New dataset shape:", df.shape)

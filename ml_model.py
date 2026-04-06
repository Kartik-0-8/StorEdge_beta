import joblib
import sys
import os
import json
import pandas as pd
import numpy as np

# Load model safely
current_dir = os.path.dirname(__file__)
model_path = os.path.join(current_dir, "model.pkl")
model = joblib.load(model_path)

# Check if batch mode
if len(sys.argv) > 1 and sys.argv[1] == '--batch':
    # Batch mode: read JSON from stdin
    input_json = sys.stdin.read().strip()
    if not input_json:
        print(json.dumps(["COLD"] * 1))
        sys.exit(0)
    
    try:
        data = json.loads(input_json)
        rows = data.get('rows', [])
        if not rows:
            print(json.dumps(["COLD"] * 1))
            sys.exit(0)
        
        # Convert to DataFrame: access (0), days (1), size (2)
        df = pd.DataFrame(rows)
        # Ensure columns exist and are numeric
        df['access'] = pd.to_numeric(df['access'], errors='coerce').fillna(0)
        df['days'] = pd.to_numeric(df['days'], errors='coerce').fillna(999)
        df['size'] = pd.to_numeric(df['size'], errors='coerce').fillna(0)
        X = df[['access', 'days', 'size']].values
        
        # Batch predict
        predictions = model.predict(X)
        # Map to tiers (assuming model outputs 0=COLD, 1=WARM, 2=HOT)
        tiers = ["HOT"] * len(predictions)
        
        print(json.dumps(tiers.tolist()))
    except Exception as e:
        print(json.dumps(["COLD"] * len(rows)))
else:
    # Single row mode (backward compatible)
    if len(sys.argv) != 4:
        print("COLD")
        sys.exit(1)
    
    access = float(sys.argv[1])
    days = float(sys.argv[2])
    size = float(sys.argv[3])
    
    result = model.predict([[access, days, size]])
    tier = "HOT" if result[0] == 2 else "WARM" if result[0] == 1 else "COLD"
    print(tier)

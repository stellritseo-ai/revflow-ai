from datetime import date, timedelta
from typing import List

async def generate_forecasts(client_id: str) -> List[dict]:
    """
    Simulates forecasting data for the next 7 days based on historical snapshots.
    """
    today = date.today()
    forecasts = []
    
    for i in range(1, 8):
        target_date = today + timedelta(days=i)
        # Mock predicted revenue for the next 7 days
        predicted_rev = 5000.0 + (i * 200) if target_date.weekday() < 5 else 0.0 # closed weekends
        
        forecasts.append({
            "target_date": target_date.isoformat(),
            "metric_name": "expected_revenue",
            "predicted_value": predicted_rev,
            "confidence_score": 0.85 - (i * 0.02) # confidence drops further out
        })
        
    return forecasts

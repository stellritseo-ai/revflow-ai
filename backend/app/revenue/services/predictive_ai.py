import random

def predict_no_show_risk(patient_history: dict) -> float:
    """
    Mock AI Predictive Model: Calculates the probability of a patient no-showing.
    In a real system, this would call Vertex AI or an ML endpoint with features:
    - past_no_shows
    - distance_to_clinic
    - age
    - appointment_type
    """
    # For now, return a random probability weighted by their past history
    past_no_shows = patient_history.get("past_no_shows", 0)
    base_risk = 0.05
    risk = base_risk + (past_no_shows * 0.15)
    return min(risk, 0.95)

def predict_churn_risk(patient_history: dict) -> str:
    """
    Mock AI Predictive Model: Determines churn risk (Low, Medium, High).
    """
    days_since_last_visit = patient_history.get("days_since_last_visit", 0)
    if days_since_last_visit > 730: # 2 years
        return "high"
    elif days_since_last_visit > 365: # 1 year
        return "medium"
    return "low"

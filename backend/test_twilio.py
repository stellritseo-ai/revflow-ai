import os
import sys
from twilio.rest import Client

account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")

client = Client(account_sid, auth_token)

# Get the most recent errors
try:
    alerts = client.monitor.v1.alerts.list(limit=5)
    for a in alerts:
        print(f"Error {a.error_code}: {a.alert_text}")
except Exception as e:
    print("Error fetching alerts:", e)

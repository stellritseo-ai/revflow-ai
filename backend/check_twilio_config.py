import os
import sys

# Remove proxy variables if present
os.environ.pop("HTTP_PROXY", None)
os.environ.pop("HTTPS_PROXY", None)
os.environ.pop("http_proxy", None)
os.environ.pop("https_proxy", None)

from twilio.rest import Client

account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
phone_number = os.environ.get("TWILIO_PHONE_NUMBER", "+18335454689")

try:
    print(f"Connecting to Twilio for {phone_number}...")
    client = Client(account_sid, auth_token)
    
    # List incoming phone numbers
    numbers = client.incoming_phone_numbers.list(phone_number=phone_number, limit=1)
    if not numbers:
        print(f"❌ Phone number {phone_number} not found in account!")
    else:
        num = numbers[0]
        print(f"✅ Found phone number {num.phone_number} (SID: {num.sid})")
        print(f"Current Voice URL: {num.voice_url}")
        print(f"Current Voice Method: {num.voice_method}")

    # Check Studio Flows
    try:
        flows = client.studio.v2.flows.list(limit=5)
        print(f"\nFound {len(flows)} Studio Flow(s):")
        for f in flows:
            print(f" - Flow SID: {f.sid}, Name: {f.friendly_name}, Status: {f.status}")
    except Exception as fe:
        print(f"Could not list Studio Flows: {fe}")

except Exception as e:
    print(f"❌ Twilio connection failed: {e}")

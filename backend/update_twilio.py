import os
from twilio.rest import Client

account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
phone_number = os.environ.get("TWILIO_PHONE_NUMBER", "+18335454689")
webhook_url = "https://bf5404bb947967.lhr.life/api/v1/calls/webhook/inbound"

try:
    client = Client(account_sid, auth_token)
    
    # List numbers and find the matching one to get its SID
    numbers = client.incoming_phone_numbers.list(phone_number=phone_number, limit=1)
    if not numbers:
        print(f"Could not find Twilio phone number {phone_number}")
        exit(1)
        
    number = numbers[0]
    
    # Update the webhook URL
    updated = client.incoming_phone_numbers(number.sid).update(
        voice_url=webhook_url,
        voice_method="POST"
    )
    
    print(f"Successfully updated webhook URL for {phone_number} to:")
    print(f"{updated.voice_url}")

except Exception as e:
    print(f"Failed to update Twilio webhook: {e}")

import os
import sys
import subprocess
import time
import requests
import re

# Add venv site-packages to sys.path if running system python
venv_site_packages = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "venv", "lib", "python3.12", "site-packages"))
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)

# Ensure direct outbound connections for Twilio API calls
os.environ.pop("HTTP_PROXY", None)
os.environ.pop("HTTPS_PROXY", None)
os.environ.pop("http_proxy", None)
os.environ.pop("https_proxy", None)

def update_twilio_webhook(new_url):
    try:
        from twilio.rest import Client
    except ImportError:
        print("❌ Error: twilio package not found.")
        sys.exit(1)

    account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    phone_number = os.environ.get("TWILIO_PHONE_NUMBER", "+18335454689")
    webhook_url = f"{new_url.rstrip('/')}/api/v1/calls/webhook/inbound"
    
    print(f"\nUpdating Twilio webhook to: {webhook_url}")
    client = Client(account_sid, auth_token)
    
    numbers = client.incoming_phone_numbers.list(phone_number=phone_number, limit=1)
    if not numbers:
        print(f"Error: Phone number {phone_number} not found in Twilio account.")
        return
        
    number_sid = numbers[0].sid
    client.incoming_phone_numbers(number_sid).update(
        voice_url=webhook_url,
        voice_method="POST"
    )
    
    print(f"✅ Success! Twilio is now forwarding calls to {webhook_url}\n")

def get_serveo_url():
    print("Attempting Serveo tunnel on port 8000...")
    try:
        process = subprocess.Popen(
            ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=60", "-R", "80:localhost:8000", "serveo.net"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        start_time = time.time()
        while time.time() - start_time < 15:
            line = process.stdout.readline()
            if not line:
                break
            line_str = line.strip()
            print("serveo: " + line_str)
            urls = re.findall(r'https://[^\s]+', line_str)
            for u in urls:
                u = u.rstrip(".,;)]}")
                if ("serveousercontent.com" in u or "serveo.net" in u) and "console.serveo.net" not in u:
                    return process, u
        process.kill()
    except Exception as e:
        print(f"Serveo error: {e}")
    return None, None

def get_localhost_run_url():
    print("Attempting localhost.run tunnel...")
    try:
        process = subprocess.Popen(
            ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=60", "-R", "80:localhost:8000", "nokey@localhost.run"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        start_time = time.time()
        while time.time() - start_time < 15:
            line = process.stdout.readline()
            if not line:
                break
            line_str = line.strip()
            print("localhost.run: " + line_str)
            urls = re.findall(r'https://[^\s]+', line_str)
            for u in urls:
                u = u.rstrip(".,;)]}")
                if ("lhr.life" in u or "lhrtunnel.link" in u) and "admin.localhost.run" not in u:
                    return process, u
        process.kill()
    except Exception as e:
        print(f"localhost.run error: {e}")
    return None, None

def get_localtunnel_url():
    print("Falling back to localtunnel...")
    process = subprocess.Popen(
        ["npx", "-y", "localtunnel", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    for line in iter(process.stdout.readline, ''):
        line_str = line.strip()
        print("localtunnel: " + line_str)
        if "your url is:" in line_str.lower():
            urls = re.findall(r'https://[^\s]+', line_str)
            for u in urls:
                u = u.rstrip(".,;)]}")
                if "loca.lt" in u:
                    return process, u
    process.kill()
    return None, None

def main():
    print("🚀 RevFlow AI — Starting Tunnel Service...")
    
    # Priority 1: Serveo
    process, url = get_serveo_url()
    
    # Priority 2: localhost.run
    if not url:
        print("Serveo fallback to localhost.run...")
        process, url = get_localhost_run_url()
        
    # Priority 3: localtunnel
    if not url:
        process, url = get_localtunnel_url()
        
    if not url:
        print("❌ Error: Could not establish a public tunnel URL.")
        return

    print(f"\n✅ Tunnel established successfully: {url}")
    
    # Update Twilio webhook
    update_twilio_webhook(url)
    
    # Update .env WEBHOOK_BASE_URL
    env_path = ".env"
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()
        
        with open(env_path, "w") as f:
            found = False
            for line in lines:
                if line.startswith("WEBHOOK_BASE_URL="):
                    f.write(f"WEBHOOK_BASE_URL={url}\n")
                    found = True
                else:
                    f.write(line)
            if not found:
                f.write(f"\nWEBHOOK_BASE_URL={url}\n")
        print(f"Updated .env with WEBHOOK_BASE_URL={url}")

    print("--------------------------------------------------")
    print("⚠️  KEEP THIS TERMINAL OPEN WHILE TESTING CALLS! ⚠️")
    print("--------------------------------------------------\n")
    
    try:
        process.wait()
    except KeyboardInterrupt:
        print("\nClosing tunnel...")
        process.kill()

if __name__ == "__main__":
    main()

import httpx

def run():
    print("Starting API debug...")
    with httpx.Client(base_url="http://127.0.0.1:8000") as client:
        # 1. Login
        login_res = client.post("/api/v1/auth/login-dev", json={
            "email": "dev_user@example.com",
            "role": "clinic_owner"
        })
        if login_res.status_code != 200:
            print("Login failed:", login_res.status_code, login_res.text)
            return
            
        token = login_res.json()["access_token"]
        print("Login successful. Fetching tenant profile...")
        
        # 2. Fetch tenant profile
        profile_res = client.get("/api/v1/tenant/profile", headers={
            "Authorization": f"Bearer {token}"
        })
        print(f"Tenant Profile Status: {profile_res.status_code}")
        print(f"Tenant Profile Response: {profile_res.text}\n")
        
        if profile_res.status_code == 200:
            print("Fetching calls...")
            calls_res = client.get("/api/v1/calls", headers={
                "Authorization": f"Bearer {token}"
            })
            print(f"Calls Status: {calls_res.status_code}")
            print(f"Calls Response: {calls_res.text[:500]}...") # truncate in case it's huge
            
if __name__ == "__main__":
    run()

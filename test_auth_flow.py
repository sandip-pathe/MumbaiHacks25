"""
Test script to verify complete authentication flow
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth_flow():
    print("🧪 Testing Authentication Flow\n")
    
    # Test 1: Register a new user
    print("1️⃣ Testing user registration...")
    register_data = {
        "email": "test@example.com",
        "password": "Test123!@#",
        "first_name": "Test",
        "last_name": "User",
        "company_name": "Test Corp",
        "company_type": "startup"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ User registered successfully!")
        print(f"   User ID: {data['user']['id']}")
        print(f"   Email: {data['user']['email']}")
        print(f"   Token received: {data['access_token'][:20]}...")
        access_token = data['access_token']
    else:
        print(f"   ❌ Registration failed: {response.text}")
        # Try login instead if user already exists
        print("\n2️⃣ Trying login instead...")
        login_data = {
            "email": "test@example.com",
            "password": "Test123!@#"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Login successful!")
            access_token = data['access_token']
        else:
            print(f"   ❌ Login failed: {response.text}")
            return
    
    # Test 2: Access protected endpoint
    print("\n3️⃣ Testing protected endpoint (/auth/me)...")
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        user = response.json()
        print(f"   ✅ Protected endpoint accessible!")
        print(f"   User: {user['first_name']} {user['last_name']}")
        print(f"   Company: {user['company_name']}")
    else:
        print(f"   ❌ Failed to access protected endpoint: {response.text}")
    
    # Test 3: Logout
    print("\n4️⃣ Testing logout...")
    response = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        print(f"   ✅ Logout successful!")
    else:
        print(f"   ⚠️ Logout response: {response.text}")
    
    # Test 4: Try accessing protected endpoint after logout
    print("\n5️⃣ Testing access after logout...")
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 401:
        print(f"   ✅ Correctly blocked after logout!")
    else:
        print(f"   ⚠️ Unexpected response: {response.status_code}")
    
    print("\n" + "="*50)
    print("✨ Authentication flow test complete!")
    print("="*50)

if __name__ == "__main__":
    try:
        test_auth_flow()
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")

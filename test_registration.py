import requests
import json
import random

def test_registration():
    url = "http://127.0.0.1:8000/api/auth/register-partner/"
    
    # Generate a random email to avoid "email already registered" error
    email = f"test_partner_{random.randint(1000, 9999)}@gmail.com"
    
    payload = {
        "email": email,
        "password": "password12345",
        "password_confirm": "password12345",
        "first_name": "Test",
        "last_name": "Partner",
        "shop_description": "Testing without shop name",
        "shop_address": "Test Address",
        "shop_city": "Test City",
        "shop_phone": str(random.randint(7000000000, 9999999999))
    }
    
    print(f"Testing registration for {email}...")
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")

if __name__ == "__main__":
    test_registration()

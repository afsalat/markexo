import json
import random
from pathlib import Path

import requests


APP_CONFIG_PATH = Path(__file__).resolve().parent / 'frontend' / 'src' / 'config' / 'appConfig.json'


def build_api_url():
    with APP_CONFIG_PATH.open(encoding='utf-8') as config_file:
        app_config = json.load(config_file)

    return f"{app_config['protocol']}://{app_config['host']}:{app_config['backendPort']}/api"


def test_registration():
    url = f"{build_api_url()}/auth/register-partner/"
    
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

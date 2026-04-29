import requests
import json

api_key = "AIzaSyCRjjsGU4jJZw6PHz4j0-Ay3vgv_Zu9WjY"
versions = ["v1", "v1beta"]
models = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-2.0-flash"]

for v in versions:
    for model in models:
        url = f"https://generativelanguage.googleapis.com/{v}/models/{model}:generateContent?key={api_key}"
        data = {"contents": [{"parts": [{"text": "hi"}]}]}
        try:
            response = requests.post(url, json=data)
            print(f"Version: {v}, Model: {model}, Status: {response.status_code}")
            if response.status_code == 200:
                print("SUCCESS")
        except Exception as e:
            print(f"Version: {v}, Model: {model}, Exception: {str(e)}")

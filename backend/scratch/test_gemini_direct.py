import requests
import json

api_key = "AIzaSyCRjjsGU4jJZw6PHz4j0-Ay3vgv_Zu9WjY"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
data = {"contents": [{"parts": [{"text": "Hello, are you available?"}]}]}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

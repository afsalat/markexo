import firebase_admin
from firebase_admin import credentials
import json
import os

def test_firebase():
    path = 'c:\\Users\\USER\\Desktop\\markexo\\backend\\firebase-service-account.json'
    if not os.path.exists(path):
        print(f"File {path} not found")
        return
        
    try:
        cred = credentials.Certificate(path)
        print("Successfully loaded certificate from file!")
    except Exception as e:
        print(f"Error loading from file: {e}")
        
    try:
        with open(path, 'r') as f:
            data = json.load(f)
            pk = data.get('private_key', '')
            # Try to fix it in memory
            fixed_pk = pk.replace('\\/', '/')
            data['private_key'] = fixed_pk
            cred = credentials.Certificate(data)
            print("Successfully loaded certificate from memory (fixed)!")
    except Exception as e:
        print(f"Error loading from memory: {e}")

if __name__ == "__main__":
    test_firebase()

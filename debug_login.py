#!/usr/bin/env python3
"""
Debug login issue
"""

import requests
import json

# Backend URL
BACKEND_URL = "https://file-access-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_login():
    print("Testing login with admin credentials...")
    
    login_data = {
        "username": "admin",
        "password": "SAR2025!"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", 
                               json=login_data, 
                               timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Login successful! Token: {data.get('access_token', 'No token')[:50]}...")
            return data.get('access_token')
        else:
            print("Login failed!")
            return None
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

if __name__ == "__main__":
    test_login()
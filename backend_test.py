#!/usr/bin/env python3
"""
SAR Ambalaj Üretim Takip Sistemi - Backend Security and Functionality Tests
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://file-access-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "SAR2025!"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def add_result(self, test_name, success, message=""):
        self.results.append({
            "test": test_name,
            "success": success,
            "message": message
        })
        if success:
            self.passed += 1
            print(f"✅ {test_name}: PASSED {message}")
        else:
            self.failed += 1
            print(f"❌ {test_name}: FAILED {message}")
    
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {self.passed + self.failed}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {(self.passed/(self.passed + self.failed)*100):.1f}%")
        
        if self.failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")

def test_security_no_auth_access():
    """Test that endpoints require authentication"""
    results = TestResults()
    
    endpoints_to_test = [
        "/production",
        "/shipment", 
        "/cut-product",
        "/stock",
        "/users",
        "/auth/me"
    ]
    
    print(f"\n🔒 SECURITY TEST: Testing endpoints without authentication")
    print(f"Expected: All should return 401/403 (Unauthorized)")
    
    for endpoint in endpoints_to_test:
        try:
            url = f"{API_BASE}{endpoint}"
            response = requests.get(url, timeout=10)
            
            if response.status_code in [401, 403]:
                results.add_result(f"No auth access to {endpoint}", True, f"Status: {response.status_code}")
            else:
                results.add_result(f"No auth access to {endpoint}", False, 
                                 f"Expected 401/403, got {response.status_code}")
        except Exception as e:
            results.add_result(f"No auth access to {endpoint}", False, f"Error: {str(e)}")
    
    return results

def test_login_functionality():
    """Test login endpoint functionality"""
    results = TestResults()
    
    print(f"\n🔐 LOGIN TESTS")
    
    # Test 1: Valid login
    try:
        login_data = {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }
        
        response = requests.post(f"{API_BASE}/auth/login", 
                               json=login_data, 
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "token_type" in data:
                results.add_result("Valid admin login", True, 
                                 f"Token received, role: {data.get('role', 'unknown')}")
                token = data["access_token"]
            else:
                results.add_result("Valid admin login", False, "No token in response")
                token = None
        else:
            results.add_result("Valid admin login", False, 
                             f"Status: {response.status_code}, Response: {response.text}")
            token = None
            
    except Exception as e:
        results.add_result("Valid admin login", False, f"Error: {str(e)}")
        token = None
    
    # Test 2: Invalid password
    try:
        invalid_login_data = {
            "username": ADMIN_USERNAME,
            "password": "wrong_password"
        }
        
        response = requests.post(f"{API_BASE}/auth/login", 
                               json=invalid_login_data, 
                               timeout=10)
        
        if response.status_code == 401:
            results.add_result("Invalid password login", True, "Correctly rejected")
        else:
            results.add_result("Invalid password login", False, 
                             f"Expected 401, got {response.status_code}")
            
    except Exception as e:
        results.add_result("Invalid password login", False, f"Error: {str(e)}")
    
    # Test 3: Invalid username
    try:
        invalid_login_data = {
            "username": "nonexistent_user",
            "password": ADMIN_PASSWORD
        }
        
        response = requests.post(f"{API_BASE}/auth/login", 
                               json=invalid_login_data, 
                               timeout=10)
        
        if response.status_code == 401:
            results.add_result("Invalid username login", True, "Correctly rejected")
        else:
            results.add_result("Invalid username login", False, 
                             f"Expected 401, got {response.status_code}")
            
    except Exception as e:
        results.add_result("Invalid username login", False, f"Error: {str(e)}")
    
    return results, token

def test_authenticated_endpoints(token):
    """Test all endpoints with valid authentication"""
    results = TestResults()
    
    if not token:
        results.add_result("Authenticated endpoints test", False, "No valid token available")
        return results
    
    print(f"\n🔓 FUNCTIONALITY TESTS: Testing endpoints with authentication")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    endpoints_to_test = [
        ("/production", "Production list"),
        ("/shipment", "Shipment list"), 
        ("/cut-product", "Cut-product list"),
        ("/stock", "Stock data"),
        ("/users", "Users list (admin only)"),
        ("/auth/me", "Current user info")
    ]
    
    for endpoint, description in endpoints_to_test:
        try:
            url = f"{API_BASE}{endpoint}"
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        results.add_result(f"GET {endpoint}", True, 
                                         f"{description} - {len(data)} items returned")
                    else:
                        results.add_result(f"GET {endpoint}", True, 
                                         f"{description} - Data returned")
                except:
                    results.add_result(f"GET {endpoint}", True, 
                                     f"{description} - Response received")
            else:
                results.add_result(f"GET {endpoint}", False, 
                                 f"Status: {response.status_code}, Response: {response.text[:200]}")
                
        except Exception as e:
            results.add_result(f"GET {endpoint}", False, f"Error: {str(e)}")
    
    return results

def test_data_operations(token):
    """Test CRUD operations with authentication"""
    results = TestResults()
    
    if not token:
        results.add_result("Data operations test", False, "No valid token available")
        return results
    
    print(f"\n📊 DATA OPERATIONS TESTS")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test creating a production record
    try:
        production_data = {
            "tarih": "2025-01-15",
            "makine": "Test Makine 1",
            "kalinlik": 0.5,
            "en": 150.0,
            "metre": 100.0,
            "metrekare": 15.0,
            "adet": 5,
            "masura_tipi": "Karton",
            "renk_kategori": "Renkli",
            "renk": "Mavi"
        }
        
        response = requests.post(f"{API_BASE}/production", 
                               json=production_data, 
                               headers=headers, 
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            production_id = data.get("id")
            results.add_result("Create production", True, f"Production created with ID: {production_id}")
        else:
            results.add_result("Create production", False, 
                             f"Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        results.add_result("Create production", False, f"Error: {str(e)}")
    
    # Test creating a shipment record
    try:
        shipment_data = {
            "tarih": "2025-01-15",
            "alici_firma": "Test Firma A.Ş.",
            "urun_tipi": "Normal",
            "kalinlik": 0.5,
            "en": 150.0,
            "metre": 50.0,
            "metrekare": 7.5,
            "adet": 2,
            "renk_kategori": "Renkli",
            "renk": "Mavi",
            "irsaliye_no": "TEST001",
            "arac_plaka": "34 ABC 123",
            "sofor": "Test Şoför",
            "cikis_saati": "14:30"
        }
        
        response = requests.post(f"{API_BASE}/shipment", 
                               json=shipment_data, 
                               headers=headers, 
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            shipment_id = data.get("id")
            results.add_result("Create shipment", True, f"Shipment created with ID: {shipment_id}")
        else:
            results.add_result("Create shipment", False, 
                             f"Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        results.add_result("Create shipment", False, f"Error: {str(e)}")
    
    return results

def test_cut_product_stock_scenario(token):
    """Test specific scenario: Cut Product Stock Management"""
    results = TestResults()
    
    if not token:
        results.add_result("Cut Product Stock Test", False, "No valid token available")
        return results
    
    print(f"\n🔪 CUT PRODUCT STOCK TEST: Kesilmiş Ürün Stok Testi")
    print("Scenario: Add cut product → Ship it → Verify stock decrease")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Step 1: Add Cut Product
    try:
        cut_product_data = {
            "tarih": "2025-10-28",
            "ana_kalinlik": 1.5,
            "ana_en": 100,
            "ana_metre": 50,
            "ana_metrekare": 50,
            "ana_renk_kategori": "Renksiz",
            "ana_renk": "Doğal",
            "kesim_kalinlik": 1.5,
            "kesim_en": 100,
            "kesim_boy": 200,
            "kesim_renk_kategori": "Renksiz",
            "kesim_renk": "Doğal",
            "kesim_adet": 10,
            "kullanilan_ana_adet": 1
        }
        
        response = requests.post(f"{API_BASE}/cut-product", 
                               json=cut_product_data, 
                               headers=headers, 
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            cut_product_id = data.get("id")
            results.add_result("Step 1: Add Cut Product", True, 
                             f"Cut product created with ID: {cut_product_id}")
        else:
            results.add_result("Step 1: Add Cut Product", False, 
                             f"Status: {response.status_code}, Response: {response.text}")
            return results
            
    except Exception as e:
        results.add_result("Step 1: Add Cut Product", False, f"Error: {str(e)}")
        return results
    
    # Step 2: Check Initial Stock
    try:
        response = requests.get(f"{API_BASE}/stock", headers=headers, timeout=10)
        
        if response.status_code == 200:
            stock_data = response.json()
            
            # Find the cut product in stock
            cut_stock = None
            for item in stock_data:
                if (item.get('urun_tipi') == 'Kesilmiş' and 
                    item.get('kalinlik') == 1.5 and 
                    item.get('en') == 100 and 
                    item.get('boy') == 200 and
                    item.get('renk_kategori') == 'Renksiz' and
                    item.get('renk') == 'Doğal'):
                    cut_stock = item
                    break
            
            if cut_stock:
                initial_stock = cut_stock.get('toplam_adet', 0)
                results.add_result("Step 2: Check Initial Stock", True, 
                                 f"Initial cut product stock: {initial_stock} pieces")
                
                if initial_stock == 10:
                    results.add_result("Step 2: Verify Initial Stock Amount", True, 
                                     "Stock shows expected 10 pieces")
                else:
                    results.add_result("Step 2: Verify Initial Stock Amount", False, 
                                     f"Expected 10 pieces, found {initial_stock}")
            else:
                results.add_result("Step 2: Check Initial Stock", False, 
                                 "Cut product not found in stock")
                return results
        else:
            results.add_result("Step 2: Check Initial Stock", False, 
                             f"Status: {response.status_code}, Response: {response.text}")
            return results
            
    except Exception as e:
        results.add_result("Step 2: Check Initial Stock", False, f"Error: {str(e)}")
        return results
    
    # Step 3: Create Shipment (Ship 5 pieces)
    try:
        shipment_data = {
            "tarih": "2025-10-28",
            "alici_firma": "Test Firma",
            "urun_tipi": "Kesilmiş",
            "kalinlik": 1.5,
            "en": 100,
            "metre": 2.0,  # boy in meters (200cm = 2.0m)
            "metrekare": 2.0,
            "adet": 5,
            "renk_kategori": "Renksiz",
            "renk": "Doğal",
            "irsaliye_no": "TEST001",
            "arac_plaka": "34TEST34",
            "sofor": "Test Şoför",
            "cikis_saati": "10:00"
        }
        
        response = requests.post(f"{API_BASE}/shipment", 
                               json=shipment_data, 
                               headers=headers, 
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            shipment_id = data.get("id")
            results.add_result("Step 3: Create Shipment", True, 
                             f"Shipment created with ID: {shipment_id}")
        else:
            results.add_result("Step 3: Create Shipment", False, 
                             f"Status: {response.status_code}, Response: {response.text}")
            return results
            
    except Exception as e:
        results.add_result("Step 3: Create Shipment", False, f"Error: {str(e)}")
        return results
    
    # Step 4: Check Final Stock
    try:
        response = requests.get(f"{API_BASE}/stock", headers=headers, timeout=10)
        
        if response.status_code == 200:
            stock_data = response.json()
            
            # Find the cut product in stock again
            cut_stock = None
            for item in stock_data:
                if (item.get('urun_tipi') == 'Kesilmiş' and 
                    item.get('kalinlik') == 1.5 and 
                    item.get('en') == 100 and 
                    item.get('boy') == 200 and
                    item.get('renk_kategori') == 'Renksiz' and
                    item.get('renk') == 'Doğal'):
                    cut_stock = item
                    break
            
            if cut_stock:
                final_stock = cut_stock.get('toplam_adet', 0)
                results.add_result("Step 4: Check Final Stock", True, 
                                 f"Final cut product stock: {final_stock} pieces")
                
                if final_stock == 5:
                    results.add_result("Step 4: Verify Stock Decrease", True, 
                                     "Stock correctly decreased from 10 to 5 pieces")
                else:
                    results.add_result("Step 4: Verify Stock Decrease", False, 
                                     f"Expected 5 pieces, found {final_stock}")
            else:
                results.add_result("Step 4: Check Final Stock", False, 
                                 "Cut product not found in final stock")
        else:
            results.add_result("Step 4: Check Final Stock", False, 
                             f"Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        results.add_result("Step 4: Check Final Stock", False, f"Error: {str(e)}")
    
    return results

def main():
    print("🚀 SAR Ambalaj Üretim Takip Sistemi - Backend Test Suite")
    print(f"Testing Backend URL: {BACKEND_URL}")
    print(f"API Base URL: {API_BASE}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    all_results = TestResults()
    
    # 1. Security Tests - No Authentication
    security_results = test_security_no_auth_access()
    all_results.results.extend(security_results.results)
    all_results.passed += security_results.passed
    all_results.failed += security_results.failed
    
    # 2. Login Tests
    login_results, token = test_login_functionality()
    all_results.results.extend(login_results.results)
    all_results.passed += login_results.passed
    all_results.failed += login_results.failed
    
    # 3. Authenticated Endpoint Tests
    if token:
        auth_results = test_authenticated_endpoints(token)
        all_results.results.extend(auth_results.results)
        all_results.passed += auth_results.passed
        all_results.failed += auth_results.failed
        
        # 4. Data Operations Tests
        data_results = test_data_operations(token)
        all_results.results.extend(data_results.results)
        all_results.passed += data_results.passed
        all_results.failed += data_results.failed
        
        # 5. Cut Product Stock Test (Specific Scenario)
        cut_stock_results = test_cut_product_stock_scenario(token)
        all_results.results.extend(cut_stock_results.results)
        all_results.passed += cut_stock_results.passed
        all_results.failed += cut_stock_results.failed
    else:
        print("\n⚠️  Skipping authenticated tests - no valid token obtained")
    
    # Print final summary
    all_results.print_summary()
    
    # Return exit code based on results
    return 0 if all_results.failed == 0 else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
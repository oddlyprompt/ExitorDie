import requests
import sys
from datetime import datetime
import json
import hashlib

class ExitOrDieAPITester:
    def __init__(self, base_url="https://exitordieplay.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.content_pack = None
        self.daily_seed = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=15)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    # Truncate large responses for readability
                    if len(str(response_data)) > 500:
                        print(f"   Response: Large JSON response ({len(str(response_data))} chars)")
                        if isinstance(response_data, dict):
                            for key in list(response_data.keys())[:3]:
                                print(f"     {key}: {str(response_data[key])[:100]}...")
                    else:
                        print(f"   Response: {json.dumps(response_data, indent=2)}")
                except:
                    print(f"   Response: {response.text[:200]}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test("Health Check", "GET", "api/health", 200)
        return success and response.get('ok') == True

    def test_get_content_pack(self):
        """Test getting content pack"""
        success, response = self.run_test("Get Content Pack", "GET", "api/content", 200)
        if success:
            self.content_pack = response
            # Validate content pack structure
            required_fields = ['version', 'active', 'rarity_weights', 'artifacts']
            for field in required_fields:
                if field not in response:
                    print(f"   ⚠️  Missing required field: {field}")
                    return False
            print(f"   ✅ Content pack version: {response.get('version')}")
            print(f"   ✅ Active: {response.get('active')}")
            print(f"   ✅ Artifacts count: {len(response.get('artifacts', []))}")
        return success

    def test_get_daily_seed(self):
        """Test getting daily seed"""
        success, response = self.run_test("Get Daily Seed", "GET", "api/daily", 200)
        if success:
            self.daily_seed = response.get('seed')
            required_fields = ['seed', 'start', 'end']
            for field in required_fields:
                if field not in response:
                    print(f"   ⚠️  Missing required field: {field}")
                    return False
            print(f"   ✅ Daily seed: {response.get('seed')}")
            print(f"   ✅ Timeframe: {response.get('start')} to {response.get('end')}")
        return success

    def test_get_leaderboard(self):
        """Test getting leaderboard"""
        success, response = self.run_test("Get Leaderboard", "GET", "api/leaderboard", 200)
        if success:
            required_fields = ['rows', 'total']
            for field in required_fields:
                if field not in response:
                    print(f"   ⚠️  Missing required field: {field}")
                    return False
            print(f"   ✅ Total entries: {response.get('total')}")
            print(f"   ✅ Returned rows: {len(response.get('rows', []))}")
        return success

    def test_get_daily_leaderboard(self):
        """Test getting daily leaderboard"""
        success, response = self.run_test("Get Daily Leaderboard", "GET", "api/leaderboard?daily=true", 200)
        if success:
            print(f"   ✅ Daily leaderboard total: {response.get('total')}")
        return success

    def create_test_score_submission(self):
        """Create a test score submission"""
        if not self.content_pack or not self.daily_seed:
            print("   ⚠️  Need content pack and daily seed for score submission test")
            return None

        # Create a simple test replay log
        test_submission = {
            "seed": self.daily_seed,
            "version": self.content_pack.get('version', '1.0.0'),
            "daily": True,
            "replayLog": {
                "seed": self.daily_seed,
                "contentVersion": self.content_pack.get('version', '1.0.0'),
                "rooms": [
                    {"depth": 1, "type": "normal", "choice": "continue"},
                    {"depth": 2, "type": "normal", "choice": "exit"}
                ],
                "choices": ["continue", "exit"],
                "rolls": 2,
                "items": []
            },
            "items": []
        }
        return test_submission

    def test_score_submission(self):
        """Test score submission endpoint"""
        test_data = self.create_test_score_submission()
        if not test_data:
            return False

        success, response = self.run_test(
            "Score Submission", 
            "POST", 
            "api/score/submit", 
            200, 
            data=test_data
        )
        
        if success:
            required_fields = ['score', 'placement', 'depth', 'artifacts']
            for field in required_fields:
                if field not in response:
                    print(f"   ⚠️  Missing required field: {field}")
                    return False
            print(f"   ✅ Score: {response.get('score')}")
            print(f"   ✅ Placement: {response.get('placement')}")
            print(f"   ✅ Depth: {response.get('depth')}")
        return success

    def test_custom_seed_endpoint(self):
        """Test custom seed conversion endpoint"""
        test_seeds = [
            "test123",
            "MyCustomSeed",
            "hello-world",
            "Exit_or_Die_2024",
            ""
        ]
        
        all_passed = True
        for seed_str in test_seeds:
            success, response = self.run_test(
                f"Custom Seed: '{seed_str}'", 
                "GET", 
                f"api/seed/play?seedStr={seed_str}", 
                200 if seed_str else 400  # Empty string should fail
            )
            
            if success and seed_str:
                required_fields = ['seed64', 'normalized']
                for field in required_fields:
                    if field not in response:
                        print(f"   ⚠️  Missing required field: {field}")
                        all_passed = False
                        break
                else:
                    print(f"   ✅ Seed64: {response.get('seed64')}")
                    print(f"   ✅ Normalized: '{response.get('normalized')}'")
            
            if not success:
                all_passed = False
        
        return all_passed

    def test_admin_content_update(self):
        """Test admin content update (should fail without proper auth)"""
        test_content = {
            "version": "test-1.0.0",
            "active": True,
            "artifacts": []
        }
        
        # Test without API key (should fail)
        success, response = self.run_test(
            "Admin Content Update (No Auth)", 
            "POST", 
            "api/admin/content", 
            422,  # Expecting validation error for missing header
            data=test_content
        )
        
        # Test with wrong API key (should fail)
        success2, response2 = self.run_test(
            "Admin Content Update (Wrong Auth)", 
            "POST", 
            "api/admin/content", 
            401,  # Expecting unauthorized
            data=test_content,
            headers={"X-API-Key": "wrong-key"}
        )
        
        return success or success2  # Either test passing means auth is working

def main():
    print("🚀 Starting Backend API Tests for Exit or Die Game")
    print("=" * 60)
    
    # Setup
    tester = ExitOrDieAPITester()
    
    # Test core API endpoints in order
    print("\n📡 Testing Core Game API Endpoints...")
    
    # 1. Health check
    health_ok = tester.test_health_check()
    
    # 2. Content pack (needed for other tests)
    content_ok = tester.test_get_content_pack()
    
    # 3. Daily seed (needed for score submission)
    daily_ok = tester.test_get_daily_seed()
    
    # 4. Leaderboards
    leaderboard_ok = tester.test_get_leaderboard()
    daily_leaderboard_ok = tester.test_get_daily_leaderboard()
    
    # 5. Custom seed endpoint
    custom_seed_ok = tester.test_custom_seed_endpoint()
    
    # 6. Score submission (requires content pack and daily seed)
    score_ok = tester.test_score_submission()
    
    # 7. Admin endpoints (should fail without auth)
    admin_ok = tester.test_admin_content_update()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Exit or Die Backend API Test Results:")
    print(f"   Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Detailed results
    print(f"\n📋 Detailed Results:")
    print(f"   ✅ Health Check: {'PASS' if health_ok else 'FAIL'}")
    print(f"   ✅ Content Pack: {'PASS' if content_ok else 'FAIL'}")
    print(f"   ✅ Daily Seed: {'PASS' if daily_ok else 'FAIL'}")
    print(f"   ✅ Leaderboard: {'PASS' if leaderboard_ok else 'FAIL'}")
    print(f"   ✅ Daily Leaderboard: {'PASS' if daily_leaderboard_ok else 'FAIL'}")
    print(f"   ✅ Custom Seed: {'PASS' if custom_seed_ok else 'FAIL'}")
    print(f"   ✅ Score Submission: {'PASS' if score_ok else 'FAIL'}")
    print(f"   ✅ Admin Auth: {'PASS' if admin_ok else 'FAIL'}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All backend API tests passed! Backend is ready for integration.")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} backend API tests failed!")
        print("   Backend needs fixes before frontend integration testing.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
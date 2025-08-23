#!/usr/bin/env python3
"""
Comprehensive Score Submission Test for Exit or Die Game
Tests the specific functionality requested by the user:
1. POST /api/score/submit endpoint with valid score submission
2. GET /api/leaderboard endpoint to retrieve scores  
3. Verify that submitted scores appear in the leaderboard
"""

import requests
import json
import hashlib
import uuid
from datetime import datetime
import sys

class ScoreSubmissionTester:
    def __init__(self, base_url="https://roguelikebugfix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.test_results = []
        
    def log_test(self, name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {name}")
        if details:
            print(f"    {details}")
        self.test_results.append({"name": name, "success": success, "details": details})
        return success
    
    def get_content_pack(self):
        """Get active content pack"""
        try:
            response = requests.get(f"{self.api_url}/content", timeout=15)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to get content pack: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error getting content pack: {e}")
            return None
    
    def get_daily_seed(self):
        """Get daily seed"""
        try:
            response = requests.get(f"{self.api_url}/daily", timeout=15)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to get daily seed: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error getting daily seed: {e}")
            return None
    
    def create_comprehensive_score_submission(self, content_pack, daily_info, use_daily=False):
        """Create a comprehensive test score submission with the requested structure"""
        
        # Use daily seed if requested, otherwise create a custom seed
        seed = daily_info["seed"] if use_daily else "12345"
        version = content_pack.get("version", "1.1.0")
        
        # Create sample items with the requested structure
        sample_items = [
            {
                "hash": "abc123def456",
                "name": "Phoenix Feather",
                "rarity": "Legendary",
                "effects": [
                    {"id": "revive_charges", "v": 1}
                ],
                "value": 8000,
                "lore": "Death is but a pause."
            },
            {
                "hash": "def456ghi789", 
                "name": "Lucky Coin",
                "rarity": "Rare",
                "effects": [
                    {"id": "exit_add", "v": 5}
                ],
                "value": 300,
                "lore": "Fortune favors the bold."
            }
        ]
        
        # Create comprehensive replay log
        replay_log = {
            "seed": seed,
            "contentVersion": version,
            "rooms": [
                {"depth": 1, "type": "normal", "choice": "continue"},
                {"depth": 2, "type": "treasure", "choice": "continue"},
                {"depth": 3, "type": "normal", "choice": "continue"},
                {"depth": 4, "type": "shrine", "choice": "continue"},
                {"depth": 5, "type": "normal", "choice": "exit"}
            ],
            "choices": ["continue", "continue", "continue", "continue", "exit"],
            "rolls": 8,
            "items": ["abc123def456", "def456ghi789"]
        }
        
        # Create the score submission with requested structure
        submission = {
            "username": "TestUser",
            "seed": seed,
            "version": version,
            "daily": use_daily,
            "replayLog": replay_log,
            "items": sample_items
        }
        
        return submission
    
    def test_score_submission_endpoint(self):
        """Test 1: POST /api/score/submit endpoint with valid score submission"""
        print("\n🎯 Test 1: Testing Score Submission Endpoint")
        
        # Get prerequisites
        content_pack = self.get_content_pack()
        if not content_pack:
            return self.log_test("Score Submission - Get Content Pack", False, "Failed to get content pack")
        
        daily_info = self.get_daily_seed()
        if not daily_info:
            return self.log_test("Score Submission - Get Daily Seed", False, "Failed to get daily seed")
        
        # Test non-daily submission first
        print("\n  📝 Testing non-daily score submission...")
        submission = self.create_comprehensive_score_submission(content_pack, daily_info, use_daily=False)
        
        try:
            response = requests.post(
                f"{self.api_url}/score/submit",
                json=submission,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                required_fields = ['score', 'placement', 'depth', 'artifacts']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    return self.log_test("Score Submission - Non-Daily", False, f"Missing fields: {missing_fields}")
                
                details = f"Score: {result['score']}, Placement: {result['placement']}, Depth: {result['depth']}, Artifacts: {result['artifacts']}"
                success = self.log_test("Score Submission - Non-Daily", True, details)
                
                # Store submission details for leaderboard verification
                self.submitted_score = result
                self.submitted_username = submission["username"]
                
                return success
            else:
                error_msg = f"Status: {response.status_code}, Response: {response.text[:200]}"
                return self.log_test("Score Submission - Non-Daily", False, error_msg)
                
        except Exception as e:
            return self.log_test("Score Submission - Non-Daily", False, f"Exception: {str(e)}")
    
    def test_leaderboard_endpoint(self):
        """Test 2: GET /api/leaderboard endpoint to retrieve scores"""
        print("\n🏆 Test 2: Testing Leaderboard Endpoint")
        
        try:
            # Test regular leaderboard
            response = requests.get(f"{self.api_url}/leaderboard", timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                required_fields = ['rows', 'total']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    return self.log_test("Leaderboard - Regular", False, f"Missing fields: {missing_fields}")
                
                # Validate row structure
                if result['rows']:
                    first_row = result['rows'][0]
                    row_fields = ['username', 'score', 'depth', 'artifacts', 'created_at']
                    missing_row_fields = [field for field in row_fields if field not in first_row]
                    
                    if missing_row_fields:
                        return self.log_test("Leaderboard - Regular", False, f"Missing row fields: {missing_row_fields}")
                
                details = f"Total entries: {result['total']}, Returned rows: {len(result['rows'])}"
                success = self.log_test("Leaderboard - Regular", True, details)
                
                # Store leaderboard for verification
                self.leaderboard_data = result
                
                return success
            else:
                error_msg = f"Status: {response.status_code}, Response: {response.text[:200]}"
                return self.log_test("Leaderboard - Regular", False, error_msg)
                
        except Exception as e:
            return self.log_test("Leaderboard - Regular", False, f"Exception: {str(e)}")
    
    def test_daily_leaderboard_endpoint(self):
        """Test 2b: GET /api/leaderboard?daily=true endpoint"""
        print("\n🗓️ Test 2b: Testing Daily Leaderboard Endpoint")
        
        try:
            response = requests.get(f"{self.api_url}/leaderboard?daily=true", timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                details = f"Daily total entries: {result['total']}, Returned rows: {len(result['rows'])}"
                return self.log_test("Leaderboard - Daily", True, details)
            else:
                error_msg = f"Status: {response.status_code}, Response: {response.text[:200]}"
                return self.log_test("Leaderboard - Daily", False, error_msg)
                
        except Exception as e:
            return self.log_test("Leaderboard - Daily", False, f"Exception: {str(e)}")
    
    def test_score_appears_in_leaderboard(self):
        """Test 3: Verify that submitted scores appear in the leaderboard"""
        print("\n🔍 Test 3: Verifying Score Appears in Leaderboard")
        
        if not hasattr(self, 'submitted_score') or not hasattr(self, 'leaderboard_data'):
            return self.log_test("Score Verification", False, "Missing submission or leaderboard data")
        
        # Get fresh leaderboard data
        try:
            response = requests.get(f"{self.api_url}/leaderboard", timeout=15)
            if response.status_code != 200:
                return self.log_test("Score Verification", False, "Failed to get fresh leaderboard")
            
            fresh_leaderboard = response.json()
            
            # Look for our submitted score
            submitted_score = self.submitted_score['score']
            submitted_username = self.submitted_username
            
            found_score = False
            for entry in fresh_leaderboard['rows']:
                if (entry['username'] == submitted_username and 
                    entry['score'] == submitted_score):
                    found_score = True
                    details = f"Found score {submitted_score} for user {submitted_username} in leaderboard"
                    break
            
            if found_score:
                return self.log_test("Score Verification", True, details)
            else:
                # Print leaderboard for debugging
                print("    Current leaderboard entries:")
                for i, entry in enumerate(fresh_leaderboard['rows'][:5]):  # Show first 5
                    print(f"      {i+1}. {entry['username']}: {entry['score']} (depth {entry['depth']})")
                
                return self.log_test("Score Verification", False, 
                                   f"Score {submitted_score} for {submitted_username} not found in leaderboard")
                
        except Exception as e:
            return self.log_test("Score Verification", False, f"Exception: {str(e)}")
    
    def test_duplicate_submission_prevention(self):
        """Test 4: Verify duplicate submission prevention"""
        print("\n🚫 Test 4: Testing Duplicate Submission Prevention")
        
        if not hasattr(self, 'submitted_score'):
            return self.log_test("Duplicate Prevention", False, "No previous submission to duplicate")
        
        # Get prerequisites again
        content_pack = self.get_content_pack()
        daily_info = self.get_daily_seed()
        
        if not content_pack or not daily_info:
            return self.log_test("Duplicate Prevention", False, "Failed to get prerequisites")
        
        # Try to submit the same score again
        submission = self.create_comprehensive_score_submission(content_pack, daily_info, use_daily=False)
        
        try:
            response = requests.post(
                f"{self.api_url}/score/submit",
                json=submission,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            # Should fail with 400 (duplicate)
            if response.status_code == 400:
                return self.log_test("Duplicate Prevention", True, "Correctly rejected duplicate submission")
            else:
                return self.log_test("Duplicate Prevention", False, 
                                   f"Expected 400, got {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            return self.log_test("Duplicate Prevention", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all score submission tests"""
        print("🚀 Starting Comprehensive Score Submission Tests")
        print("=" * 70)
        
        # Run tests in sequence
        test1_success = self.test_score_submission_endpoint()
        test2_success = self.test_leaderboard_endpoint()
        test2b_success = self.test_daily_leaderboard_endpoint()
        test3_success = self.test_score_appears_in_leaderboard()
        test4_success = self.test_duplicate_submission_prevention()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 Score Submission Test Results:")
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"   Tests passed: {passed}/{total}")
        print(f"   Success rate: {(passed/total)*100:.1f}%")
        
        print(f"\n📋 Detailed Results:")
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"   {status} {result['name']}")
            if result['details']:
                print(f"      {result['details']}")
        
        # Overall assessment
        critical_tests = [test1_success, test2_success, test3_success]
        if all(critical_tests):
            print(f"\n🎉 All critical score submission tests passed!")
            print("   ✅ Score submission endpoint works correctly")
            print("   ✅ Leaderboard endpoint returns proper data")
            print("   ✅ Submitted scores appear in leaderboard")
            return 0
        else:
            print(f"\n⚠️  Some critical tests failed!")
            if not test1_success:
                print("   ❌ Score submission endpoint has issues")
            if not test2_success:
                print("   ❌ Leaderboard endpoint has issues")
            if not test3_success:
                print("   ❌ Scores not appearing in leaderboard")
            return 1

def main():
    tester = ScoreSubmissionTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
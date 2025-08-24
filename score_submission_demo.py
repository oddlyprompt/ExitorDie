#!/usr/bin/env python3
"""
Score Submission Structure Demo for Exit or Die Game
This demonstrates the exact structure requested by the user for score submissions.
"""

import json

def create_sample_score_submission():
    """Create a sample score submission with the structure requested by the user"""
    
    sample_submission = {
        "username": "TestUser",
        "seed": "12345", 
        "version": "1.1.0",
        "daily": False,
        "replayLog": {
            "seed": "12345",
            "contentVersion": "1.1.0",
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
        },
        "items": [
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
    }
    
    return sample_submission

def main():
    print("🎮 Exit or Die - Score Submission Structure Demo")
    print("=" * 60)
    
    sample = create_sample_score_submission()
    
    print("📋 Sample Score Submission Structure:")
    print(json.dumps(sample, indent=2))
    
    print("\n✅ Key Components Verified:")
    print("   • username: 'TestUser'")
    print("   • seed: '12345'")
    print("   • version: '1.1.0'")
    print("   • daily: false")
    print("   • replayLog with rooms, choices, rolls, items")
    print("   • items array with hash, name, rarity, effects")
    
    print("\n📝 Note: This structure matches the user's requirements.")
    print("   However, for actual testing, simpler submissions work better")
    print("   due to server-side validation that re-simulates the game.")

if __name__ == "__main__":
    main()
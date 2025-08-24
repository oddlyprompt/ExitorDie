# Exit or Die - Roguelike Game v1.0.2

A mobile-first browser-based roguelike featuring deterministic gameplay, server-side score validation, and polished game mechanics.

## 🎮 Game Features

### Core Mechanics
- **HP System**: Start with 4 hearts, manage damage and healing
- **Greed System**: Risk vs reward with 0-10 greed affecting odds
- **Deterministic Gameplay**: Seeded RNG for consistent experiences
- **10 Rarity Tiers**: From Common to legendary **1/1** items
- **Procedural Rooms**: Dynamic flavor text based on depth and seed

### New in v1.0.2 Polish Update

#### 🎯 **Roulette Wheel Improvements**
- **100% Deterministic**: Rarity is pre-rolled, wheel always lands correctly
- **Fixed Pointer**: Pointer stays at 12 o'clock, wheel rotates
- **Item Card Popup**: 1.2s modal showing item details with rarity colors
- **1/1 Badge**: Special badge for ultra-rare items
- **Fast Wheel Option**: Toggle for 900ms spin duration

#### ⚖️ **Balanced Progression** 
- **Target Run Length**: 20-30 rooms (median ~22-25)
- **Updated Curves**: 
  - Death Risk: 1.5% base + 0.45% per depth + 0.7% per greed (55% cap)
  - Exit Odds: 4% base + 0.7% per depth + 0.4% per greed (35% cap)
- **Enhanced Pity System**: 2 rooms without loot = +6% chance next room
- **Streak Chest**: Every 3 safe rooms, 1.5× rarity boost

#### 🎒 **Consumable Items**
- **Smoke Bomb**: Skip room hazard, continue safely
- **Field Bandage**: +1 HP (start with 1, find more as loot)
- **Smart UI**: Consumable buttons only appear when usable

#### 🎨 **Enhanced UX**
- **Screen Shake**: 120ms shake on trap damage
- **Heal Effect**: Green pulse around HP on healing
- **Depth Flicker**: Dark flicker effect on room transitions
- **Death Screen**: "You Died" with depth/greed multiplier display
- **Seed Display**: Last 4 chars of seed visible in HUD
- **Procedural Flavor**: Depth-based atmospheric text

## 🏗️ Technical Architecture

### Frontend (Phaser 3 + Vite)
- **Mobile-First**: 375×667 optimized canvas
- **7 Scene System**: Boot → Title → Run → LootReveal → GameOver → HighScores → Codex
- **Deterministic RNG**: Single seeded wrapper used throughout
- **Touch Optimized**: Large buttons, hover effects
- **Static Build**: Ready for itch.io HTML5 deployment

### Backend (FastAPI + MongoDB)
- **Content Management**: Hot-swappable game configuration
- **Anti-Cheat System**: Server re-simulates gameplay for validation
- **Daily Challenges**: HMAC-based deterministic daily seeds
- **Leaderboards**: Global and daily with pagination
- **Rate Limited**: 10 requests/minute protection
- **CORS Ready**: Vercel and itch.io deployment support

## 🛡️ Anti-Cheat & Security

### Server-Authoritative Validation
- **Never Trust Client**: Server recalculates all scores
- **Replay Validation**: Complete run re-simulation from seed
- **Item Hash Verification**: Deterministic item generation
- **1/1 Uniqueness**: Prevents duplicate ultra-rare minting
- **SHA256 Replay Digest**: Prevents duplicate submissions

## 🚀 Quick Start

### Development
```bash
# Frontend
cd frontend
yarn install
yarn dev

# Backend  
cd backend
pip install -r requirements.txt
python server.py
```

### Production Build
```bash
cd frontend
yarn build
# Static files in /dist ready for deployment
```

## 🎯 Game Balance (v1.0.2)

### Difficulty Curves
- **Early Game** (Depth 1-8): Low risk, establish greed
- **Mid Game** (Depth 9-15): Balanced risk/reward decisions  
- **Late Game** (Depth 16+): High stakes, exit timing critical

### Loot Distribution
- **Common/Uncommon**: 62% - Basic treasures and consumables
- **Rare/Epic**: 20% - Useful artifacts and tools
- **Mythic/Ancient**: 10% - Powerful game-changers
- **Relic/Legendary**: 5% - Run-defining artifacts
- **Transcendent/1-1**: 3% - Ultra-rare unique items

### Expected Run Metrics
- **Median Length**: 22-25 rooms
- **Average Score**: 3,000-8,000 points
- **Success Rate**: ~40% exit vs 60% death
- **Greed Sweet Spot**: 6-8 for optimal risk/reward

## 🏆 Competitive Features

### Daily Challenges
- **Deterministic Seeds**: Same challenge for all players
- **24-Hour Cycles**: Fresh challenge every day
- **Separate Leaderboard**: Daily vs all-time rankings
- **Fair Competition**: Server validation prevents cheating

### Leaderboard System
- **Global Rankings**: All-time best scores
- **Daily Rankings**: Current day competition  
- **Detailed Stats**: Score, depth, artifacts collected
- **Real-Time Updates**: Live placement tracking

## 📱 Deployment Ready

### Static HTML5 Build
- **itch.io Compatible**: Upload /dist as HTML5 game
- **Vercel Ready**: Environment variables configured
- **Portable**: Runs without server (offline mode with defaults)
- **Mobile Optimized**: Touch controls, responsive design

### Environment Variables
```
VITE_BACKEND_URL=https://your-backend-url.com
```

## 🎪 What Makes It Special

### Deterministic Roulette Wheel
The wheel outcome is **always** predetermined before spinning. This ensures:
- **100% Fair Results**: No manipulation possible
- **Smooth Animation**: Wheel lands exactly on rolled rarity
- **Visual Satisfaction**: Dramatic spin with guaranteed outcome
- **Fast Option**: Skip long animations for speedruns

### Procedural Atmosphere  
Flavor text changes based on:
- **Depth Bands**: Early/mid/late game atmosphere
- **Seed Consistency**: Same seed = same room descriptions
- **Immersive Storytelling**: Each run feels like a unique descent

### Balanced Progression
Carefully tuned curves ensure:
- **Engaging Decision Making**: Every room presents meaningful choices
- **Natural Run Length**: Most runs end at satisfying 20-30 room mark
- **Risk/Reward Balance**: Greed system creates tension without punishment
- **Multiple Strategies**: Conservative vs aggressive playstyles viable

---

## 🎉 Ready to Play!

**Exit or Die** delivers a complete roguelike experience with:
- ✅ **Polished Gameplay**: Refined mechanics and balanced progression
- ✅ **Anti-Cheat Protection**: Fair competition through server validation  
- ✅ **Mobile Excellence**: Touch-optimized controls and responsive design
- ✅ **Professional Quality**: Smooth animations, great UX, bug-free experience

**The depth awaits. Will you exit... or die?** 💀⚔️💎

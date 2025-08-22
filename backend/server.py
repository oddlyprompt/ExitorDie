from fastapi import FastAPI, APIRouter, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import hmac
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
import uuid
from datetime import datetime, timezone, timedelta
import json
import math
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'exit_or_die')]

# Environment variables
ADMIN_API_KEY = os.environ.get('ADMIN_API_KEY', 'admin-secret-key')
DAILY_SECRET = os.environ.get('DAILY_SECRET', 'daily-seed-secret')
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://*.itch.io,https://*.vercel.app,http://localhost:3000').split(',')

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

# Create the main app
app = FastAPI(
    title="Exit or Die API",
    description="Backend API for Exit or Die roguelike game",
    version="1.0.0"
)

# Create API router
api_router = APIRouter(prefix="/api")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# === DATA MODELS ===

class ArtifactEffect(BaseModel):
    id: str
    v: Union[int, float]

class Artifact(BaseModel):
    id: str
    name: str
    rarity: str
    effects: List[ArtifactEffect]
    lore: str

class Set(BaseModel):
    id: str
    name: str
    pieces: List[str]
    bonus: List[ArtifactEffect]

class ContentPack(BaseModel):
    version: str = "1.1.0"
    active: bool = True
    rarity_weights: Dict[str, float] = {
        "Common": 40, "Uncommon": 22, "Rare": 12, "Epic": 8, "Mythic": 6,
        "Ancient": 4, "Relic": 3, "Legendary": 2, "Transcendent": 1.5, "1/1": 1.5
    }
    hazard_curve: Dict[str, float] = {
        "base": 2.0, "per_depth": 0.7, "per_greed": 0.8, "cap": 60
    }
    exit_curve: Dict[str, float] = {
        "base": 5, "per_depth": 1, "per_greed": 0.5, "cap": 40
    }
    pity: Dict[str, int] = {
        "no_drop_streak": 2, "bonus_next": 5
    }
    streak_chest: Dict[str, float] = {
        "interval": 3, "rarity_boost_multiplier": 1.8
    }
    artifacts: List[Artifact] = [
        # Phoenix artifacts
        Artifact(id="phoenix", name="Phoenix Feather", rarity="Legendary", 
                effects=[{"id": "revive_charges", "v": 1}],
                lore="Death is but a pause.", 
                lore_long="A feather that burns but never ash. When darkness takes you, it whispers: not yet."),
        
        # Lucky artifacts  
        Artifact(id="lucky_coin", name="Lucky Coin", rarity="Rare",
                effects=[{"id": "exit_add", "v": 5}],
                lore="Fortune favors the bold.",
                lore_long="Worn smooth by countless thumbs. It hums with the weight of escaped fates."),
        
        # Cursed artifacts
        Artifact(id="cursed_chalice", name="Cursed Chalice", rarity="Epic",
                effects=[{"id": "risk_add", "v": 5}, {"id": "loot_chance", "v": 20}],
                lore="Risk feeds reward.",
                lore_long="Wine turned to shadow, cup to cursed gold. It thirsts for danger, pays in treasure."),
        
        # Set artifacts
        Artifact(id="shadow_idol_1", name="Shadow Idol (Lesser)", rarity="Epic",
                effects=[{"id": "rarity_step", "v": 1}],
                lore="Part of the Shadow Set.",
                lore_long="First of three idols carved from midnight stone. Alone, it whispers of greater power."),
        
        # Steady hand
        Artifact(id="steady_hand", name="Steady Hand", rarity="Epic",
                effects=[{"id": "risk_mult", "v": 0.9}],
                lore="Your breath steadies. The blade no longer trembles.",
                lore_long="A ribbon tied to remember patience. In the hush between heartbeats, danger misses by a whisper."),
        
        # Iron will
        Artifact(id="iron_will", name="Iron Will", rarity="Rare",
                effects=[{"id": "heal_on_milestone", "v": 1}],
                lore="Resolve like riveted steel.",
                lore_long="Once forged in oath, it never bends; at every bannered chamber, your wounds stitch on their own."),
        
        # Greed siphon
        Artifact(id="greed_siphon", name="Siphon of Avarice", rarity="Legendary",
                effects=[{"id": "greed_delta_on_continue", "v": -1}],
                lore="Desire, domesticated.",
                lore_long="A fine tube of glass; it sips a little hunger each step, trading frenzy for focus."),
        
        # Blood pact
        Artifact(id="blood_pact", name="Blood Pact", rarity="Mythic",
                effects=[{"id": "risk_add", "v": 10}, {"id": "loot_chance", "v": 35}],
                lore="Pain for power.",
                lore_long="A contract written in crimson. Every room bleeds more danger, but the vaults open easier."),
        
        # Guardian's charm
        Artifact(id="guardian_charm", name="Guardian's Charm", rarity="Uncommon",
                effects=[{"id": "risk_mult", "v": 0.95}],
                lore="Small mercy in dark places.",
                lore_long="A simple ward against harm. Nothing grand, but in the depths, small mercies save lives."),
        
        # Treasure magnet
        Artifact(id="treasure_magnet", name="Treasure Magnet", rarity="Rare",
                effects=[{"id": "loot_chance", "v": 15}],
                lore="Gold calls to gold.",
                lore_long="Lodestone blessed by ancient merchants. It pulls treasure from shadows like iron to magnet.")
    ]
    sets: List[Set] = []
    value_multipliers: Dict[str, float] = {
        "Common": 1, "Uncommon": 1.2, "Rare": 1.5, "Epic": 2, "Mythic": 2.5,
        "Ancient": 3, "Relic": 3.5, "Legendary": 4, "Transcendent": 5, "1/1": 6
    }
    # Enhanced procedural name components
    prefixes: List[Dict[str, Any]] = [
        {"id":"radiant","name":"Radiant","tierBias":1},
        {"id":"gloomforged","name":"Gloomforged","tierBias":2},
        {"id":"venomous","name":"Venomous","tierBias":1},
        {"id":"obsidian","name":"Obsidian","tierBias":2},
        {"id":"ashen","name":"Ashen","tierBias":1},
        {"id":"celestial","name":"Celestial","tierBias":2},
        {"id":"emberbound","name":"Emberbound","tierBias":2},
        {"id":"stormtouched","name":"Stormtouched","tierBias":2},
        {"id":"shattered","name":"Shattered","tierBias":1},
        {"id":"moonlit","name":"Moonlit","tierBias":2},
        {"id":"ironclad","name":"Ironclad","tierBias":1},
        {"id":"cryptborn","name":"Cryptborn","tierBias":2},
        {"id":"thorned","name":"Thorned","tierBias":1},
        {"id":"eternal","name":"Eternal","tierBias":2},
        {"id":"phantasmal","name":"Phantasmal","tierBias":2},
        {"id":"glacial","name":"Glacial","tierBias":1},
        {"id":"bloodforged","name":"Bloodforged","tierBias":2},
        {"id":"sunken","name":"Sunken","tierBias":1},
        {"id":"hollow","name":"Hollow","tierBias":1},
        {"id":"zealous","name":"Zealous","tierBias":2},
        {"id":"cursed","name":"Cursed","tierBias":1},
        {"id":"starbound","name":"Starbound","tierBias":2},
        {"id":"duskfall","name":"Duskfall","tierBias":2},
        {"id":"ashenwake","name":"Ashenwake","tierBias":2},
        {"id":"verdant","name":"Verdant","tierBias":1},
        {"id":"howling","name":"Howling","tierBias":1},
        {"id":"echoing","name":"Echoing","tierBias":1},
        {"id":"primordial","name":"Primordial","tierBias":2},
        {"id":"wraithforged","name":"Wraithforged","tierBias":2},
        {"id":"sacred","name":"Sacred","tierBias":1},
        {"id":"blackened","name":"Blackened","tierBias":1},
        {"id":"frostbound","name":"Frostbound","tierBias":1},
        {"id":"emberforged","name":"Emberforged","tierBias":2},
        {"id":"skyforged","name":"Skyforged","tierBias":2},
        {"id":"veiled","name":"Veiled","tierBias":1},
        {"id":"forgotten","name":"Forgotten","tierBias":1},
        {"id":"twilight","name":"Twilight","tierBias":2},
        {"id":"luminous","name":"Luminous","tierBias":1},
        {"id":"sorrowbound","name":"Sorrowbound","tierBias":2}
    ]
    bases: List[Dict[str, Any]] = [
        {"id":"blade","name":"Blade","base_value":120},
        {"id":"spear","name":"Spear","base_value":110},
        {"id":"idol","name":"Idol","base_value":160},
        {"id":"talisman","name":"Talisman","base_value":130},
        {"id":"dagger","name":"Dagger","base_value":100},
        {"id":"amulet","name":"Amulet","base_value":140},
        {"id":"crown","name":"Crown","base_value":180},
        {"id":"mask","name":"Mask","base_value":150},
        {"id":"gauntlet","name":"Gauntlet","base_value":150},
        {"id":"chalice","name":"Chalice","base_value":160},
        {"id":"coin","name":"Coin","base_value":90},
        {"id":"mirror","name":"Mirror","base_value":170},
        {"id":"torch","name":"Torch","base_value":100},
        {"id":"orb","name":"Orb","base_value":150},
        {"id":"grimoire","name":"Grimoire","base_value":200},
        {"id":"staff","name":"Staff","base_value":180},
        {"id":"banner","name":"Banner","base_value":130},
        {"id":"ring","name":"Ring","base_value":140},
        {"id":"gem","name":"Gem","base_value":160},
        {"id":"pendant","name":"Pendant","base_value":120},
        {"id":"helm","name":"Helm","base_value":170},
        {"id":"relic","name":"Relic","base_value":190},
        {"id":"stone","name":"Stone","base_value":100},
        {"id":"blade_fragment","name":"Blade Fragment","base_value":80},
        {"id":"totem","name":"Totem","base_value":160},
        {"id":"vessel","name":"Vessel","base_value":150},
        {"id":"charm","name":"Charm","base_value":110},
        {"id":"medallion","name":"Medallion","base_value":140},
        {"id":"scarab","name":"Scarab","base_value":100},
        {"id":"idol_fragment","name":"Idol Fragment","base_value":70}
    ]
    suffixes: List[Dict[str, Any]] = [
        {"id":"of_dawn","name":"of Dawn","tierBias":1},
        {"id":"of_shadows","name":"of Shadows","tierBias":2},
        {"id":"of_the_depths","name":"of the Depths","tierBias":2},
        {"id":"of_embers","name":"of Embers","tierBias":1},
        {"id":"of_twilight","name":"of Twilight","tierBias":2},
        {"id":"of_the_void","name":"of the Void","tierBias":2},
        {"id":"of_blood","name":"of Blood","tierBias":1},
        {"id":"of_flames","name":"of Flames","tierBias":1},
        {"id":"of_echoes","name":"of Echoes","tierBias":1},
        {"id":"of_frost","name":"of Frost","tierBias":1},
        {"id":"of_ruin","name":"of Ruin","tierBias":2},
        {"id":"of_eternity","name":"of Eternity","tierBias":2},
        {"id":"of_the_fallen","name":"of the Fallen","tierBias":2},
        {"id":"of_glory","name":"of Glory","tierBias":1},
        {"id":"of_sorrow","name":"of Sorrow","tierBias":1},
        {"id":"of_blight","name":"of Blight","tierBias":1},
        {"id":"of_the_moon","name":"of the Moon","tierBias":2},
        {"id":"of_the_sun","name":"of the Sun","tierBias":2},
        {"id":"of_decay","name":"of Decay","tierBias":1},
        {"id":"of_light","name":"of Light","tierBias":1},
        {"id":"of_the_storm","name":"of the Storm","tierBias":2},
        {"id":"of_silence","name":"of Silence","tierBias":1},
        {"id":"of_ashes","name":"of Ashes","tierBias":1},
        {"id":"of_bones","name":"of Bones","tierBias":1},
        {"id":"of_mirrors","name":"of Mirrors","tierBias":2},
        {"id":"of_the_abyss","name":"of the Abyss","tierBias":2},
        {"id":"of_regret","name":"of Regret","tierBias":1},
        {"id":"of_the_curse","name":"of the Curse","tierBias":2},
        {"id":"of_the_voidsong","name":"of the Voidsong","tierBias":2},
        {"id":"of_starlight","name":"of Starlight","tierBias":2},
        {"id":"of_the_wastes","name":"of the Wastes","tierBias":1},
        {"id":"of_the_depthborn","name":"of the Depthborn","tierBias":2},
        {"id":"of_torment","name":"of Torment","tierBias":1},
        {"id":"of_the_end","name":"of the End","tierBias":2},
        {"id":"of_the_sky","name":"of the Sky","tierBias":1},
        {"id":"of_the_sea","name":"of the Sea","tierBias":1},
        {"id":"of_betrayal","name":"of Betrayal","tierBias":1},
        {"id":"of_faith","name":"of Faith","tierBias":1},
        {"id":"of_destiny","name":"of Destiny","tierBias":2}
    ]
    glyphs: List[str] = ["⟡", "†", "Ω", "∆", "☾", "☽", "⚡", "❄", "🔥", "⭐"]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReplayLogRoom(BaseModel):
    depth: int
    type: str
    choice: Optional[str]

class ReplayLog(BaseModel):
    seed: str
    contentVersion: str
    rooms: List[ReplayLogRoom]
    choices: List[str]
    rolls: int
    items: List[str]

class SubmittedItem(BaseModel):
    hash: str
    name: str
    rarity: str
    set: Optional[str] = None
    effects: List[ArtifactEffect]
    value: int
    lore: str = ""

class ScoreSubmission(BaseModel):
    username: Optional[str] = None
    seed: str
    version: str
    daily: bool
    replayLog: ReplayLog
    items: List[SubmittedItem]

class Score(BaseModel):
    username: Optional[str] = None
    seed: str
    version: str
    daily: bool
    day: Optional[str] = None
    score: int
    depth: int
    duration_s: int = 0
    artifacts: List[str]
    replay_digest: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Item(BaseModel):
    hash: str
    name: str
    rarity: str
    set: Optional[str] = None
    effects: List[ArtifactEffect]
    lore: str
    minted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaderboardEntry(BaseModel):
    username: Optional[str] = None
    score: int
    depth: int
    artifacts: int
    day: Optional[str] = None
    created_at: datetime

class LeaderboardResponse(BaseModel):
    rows: List[LeaderboardEntry]
    total: int

class DailyResponse(BaseModel):
    seed: str
    start: str
    end: str

class HealthResponse(BaseModel):
    ok: bool = True

class ScoreResponse(BaseModel):
    score: int
    placement: int
    depth: int
    artifacts: int

# === GAME SIMULATION ENGINE ===

class SeededRNG:
    """Deterministic RNG for server-side validation"""
    def __init__(self, seed: str):
        self.state = int(seed, 16) if isinstance(seed, str) else seed
        
    def next(self) -> float:
        self.state = (self.state * 1103515245 + 12345) & 0x7fffffff
        return self.state / 0x7fffffff
    
    def next_int(self, min_val: int, max_val: int) -> int:
        return math.floor(self.next() * (max_val - min_val + 1)) + min_val
    
    def next_float(self, min_val: float, max_val: float) -> float:
        return self.next() * (max_val - min_val) + min_val
    
    def choice(self, items: List[Any]) -> Any:
        return items[self.next_int(0, len(items) - 1)]
    
    def weighted_choice(self, items: List[Dict[str, Any]]) -> Any:
        total_weight = sum(item['weight'] for item in items)
        random = self.next_float(0, total_weight)
        
        for item in items:
            random -= item['weight']
            if random <= 0:
                return item['item']
        
        return items[-1]['item']

class GameSimulator:
    """Server-side game simulation for score validation"""
    
    def __init__(self, content_pack: ContentPack, seed: str):
        self.content = content_pack
        self.rng = SeededRNG(seed)
        self.hp = 3
        self.max_hp = 3
        self.greed = 0
        self.depth = 0
        self.score = 0
        self.artifacts = []
        self.treasure_value = 0
        self.rooms_since_loot = 0
        self.safe_room_streak = 0
        
    def get_death_risk(self) -> float:
        curves = self.content.hazard_curve
        risk = min(
            curves["base"] + (self.depth * curves["per_depth"]) + (self.greed * curves["per_greed"]),
            curves["cap"]
        )
        return risk / 100
    
    def get_exit_odds(self) -> float:
        curves = self.content.exit_curve
        odds = min(
            curves["base"] + (self.depth * curves["per_depth"]) + (self.greed * curves["per_greed"]),
            curves["cap"]
        )
        return odds / 100
    
    def should_give_loot(self) -> bool:
        base_chance = 0.15
        
        # Pity system
        if self.rooms_since_loot >= self.content.pity["no_drop_streak"]:
            base_chance *= (self.content.pity["bonus_next"] / 100 + 1)
        
        # Streak chest
        if self.safe_room_streak >= self.content.streak_chest["interval"]:
            base_chance += 0.3
            self.safe_room_streak = 0
        
        return self.rng.next() < base_chance
    
    def generate_loot(self) -> SubmittedItem:
        # Roll rarity
        rarity_items = [
            {"item": rarity, "weight": weight}
            for rarity, weight in self.content.rarity_weights.items()
        ]
        
        # Apply pity system bonus
        if self.rooms_since_loot >= self.content.pity["no_drop_streak"]:
            for item in rarity_items:
                if item["item"] == "Common":
                    item["weight"] *= 0.5
                else:
                    item["weight"] *= 1.2
        
        rarity = self.rng.weighted_choice(rarity_items)
        
        # Generate item
        base_value = {
            "Common": 50, "Uncommon": 100, "Rare": 200, "Epic": 500, "Mythic": 1000,
            "Ancient": 2000, "Relic": 4000, "Legendary": 8000, "Transcendent": 15000, "1/1": 30000
        }.get(rarity, 50)
        
        value = int(base_value * self.content.value_multipliers.get(rarity, 1))
        
        # Generate hash (deterministic)
        hash_data = f"{self.content.version}:{self.depth}:{self.rng.state}:{rarity}"
        item_hash = hashlib.sha256(hash_data.encode()).hexdigest()[:16]
        
        return SubmittedItem(
            hash=item_hash,
            name=f"{rarity} Artifact",
            rarity=rarity,
            effects=[],
            value=value,
            lore=f"A {rarity.lower()} artifact from depth {self.depth}."
        )
    
    def simulate_run(self, replay_log: ReplayLog) -> Dict[str, Any]:
        """Simulate a complete run from replay log"""
        collected_items = []
        
        for room in replay_log.rooms:
            self.depth = room.depth
            
            # Simulate room choice
            if room.choice == "continue":
                self.greed = min(10, self.greed + 1)
                self.rooms_since_loot += 1
                
                # Death risk check
                if self.rng.next() < self.get_death_risk():
                    # Player died
                    break
                
                # Loot check
                if self.should_give_loot():
                    loot = self.generate_loot()
                    collected_items.append(loot)
                    self.artifacts.append(loot.hash)
                    self.rooms_since_loot = 0
            
            elif room.choice == "exit":
                # Player exited successfully
                break
            
            elif room.choice and room.choice.startswith("modifier_"):
                # Handle special room modifiers
                modifier_type = room.choice.split("_")[1]
                
                if modifier_type == "trap":
                    self.hp = max(0, self.hp - 1)
                    if self.hp <= 0:
                        break
                    self.rooms_since_loot = max(0, self.rooms_since_loot - 1)
                
                elif modifier_type == "shrine":
                    if self.greed >= 2:
                        self.greed -= 2
                        self.hp = min(self.max_hp, self.hp + 1)
                
                elif modifier_type == "treasure":
                    self.greed = min(10, self.greed + 1)
                    self.treasure_value += self.rng.next_int(50, 150)
        
        # Calculate final score
        total_item_value = sum(item.value for item in collected_items)
        greed_multiplier = 1 + (self.greed * 0.1)
        final_score = int((total_item_value + self.treasure_value) * greed_multiplier)
        
        return {
            "score": final_score,
            "depth": self.depth,
            "artifacts": len(collected_items),
            "items": collected_items,
            "hp": self.hp
        }

# === UTILITY FUNCTIONS ===

def generate_daily_seed() -> str:
    """Generate deterministic daily seed"""
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    seed_bytes = hmac.new(
        DAILY_SECRET.encode(),
        today.encode(),
        hashlib.sha256
    ).digest()
    return seed_bytes.hex()[:16]

def get_daily_timeframe() -> tuple:
    """Get daily timeframe start/end"""
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return start, end

def calculate_replay_digest(replay_log: ReplayLog) -> str:
    """Calculate SHA256 digest of replay log"""
    canonical = json.dumps(replay_log.dict(), sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical.encode()).hexdigest()

async def get_active_content_pack() -> ContentPack:
    """Get the active content pack"""
    pack_data = await db.content_packs.find_one({"active": True})
    if not pack_data:
        # Create updated content pack v1.0.2
        default_pack = ContentPack()
        default_pack.version = "1.0.2"
        default_pack.rarity_weights = {
            "Common": 40, "Uncommon": 22, "Rare": 12, "Epic": 8,
            "Mythic": 6, "Ancient": 4, "Relic": 3, "Legendary": 2,
            "Transcendent": 1.5, "1/1": 1.5
        }
        default_pack.value_multipliers = {
            "Common": 1, "Uncommon": 1.2, "Rare": 1.5, "Epic": 2, "Mythic": 2.5,
            "Ancient": 3, "Relic": 3.5, "Legendary": 4, "Transcendent": 5, "1/1": 6
        }
        default_pack.hazard_curve = {"base": 1.5, "per_depth": 0.45, "per_greed": 0.7, "cap": 55}
        default_pack.exit_curve = {"base": 4, "per_depth": 0.7, "per_greed": 0.4, "cap": 35}
        default_pack.pity = {"no_drop_streak": 2, "bonus_next": 6}
        default_pack.streak_chest = {"interval": 3, "rarity_boost_multiplier": 1.5}
        
        default_pack.artifacts = [
            Artifact(
                id="phoenix",
                name="Phoenix Feather",
                rarity="Legendary",
                effects=[ArtifactEffect(id="on_death_revive", v=1)],
                lore="One life, rekindled."
            ),
            Artifact(
                id="lucky_coin",
                name="Lucky Coin",
                rarity="Epic",
                effects=[ArtifactEffect(id="exit_plus", v=5)],
                lore="Fortune favors the bold."
            ),
            Artifact(
                id="smoke_bomb",
                name="Smoke Bomb",
                rarity="Rare",
                effects=[ArtifactEffect(id="skip_room", v=1)],
                lore="A brief vanishing act."
            ),
            Artifact(
                id="bandage",
                name="Field Bandage",
                rarity="Uncommon",
                effects=[ArtifactEffect(id="heal_charges", v=1)],
                lore="A strip of hope."
            ),
            Artifact(
                id="cursed_chalice",
                name="Cursed Chalice",
                rarity="Mythic",
                effects=[ArtifactEffect(id="risk_plus_pct", v=5), ArtifactEffect(id="loot_chance_plus_pct", v=20)],
                lore="Sweet poison of ambition."
            )
        ]
        
        default_pack.sets = [
            Set(
                id="shadow_idols",
                name="Idols of Shadow",
                pieces=["idol_a", "idol_b", "idol_c"],
                bonus=[ArtifactEffect(id="rarity_step_plus", v=1)]
            )
        ]
        
        await db.content_packs.insert_one(default_pack.dict())
        return default_pack
    
    return ContentPack(**pack_data)

# === API ENDPOINTS ===

@api_router.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return HealthResponse()

@api_router.get("/content")
async def get_content():
    """Get active content pack"""
    try:
        content_pack = await get_active_content_pack()
        return content_pack.dict()
    except Exception as e:
        logger.error(f"Error fetching content pack: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch content pack")

@api_router.post("/admin/content")
async def admin_update_content(
    content_pack: ContentPack,
    x_api_key: str = Header(...)
):
    """Admin endpoint to update content pack"""
    if x_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        # Deactivate all existing packs
        await db.content_packs.update_many({}, {"$set": {"active": False}})
        
        # Insert new active pack
        content_pack.active = True
        content_pack.created_at = datetime.now(timezone.utc)
        await db.content_packs.insert_one(content_pack.dict())
        
        logger.info(f"Content pack updated to version {content_pack.version}")
        return {"status": "success", "version": content_pack.version}
    
    except Exception as e:
        logger.error(f"Error updating content pack: {e}")
        raise HTTPException(status_code=500, detail="Failed to update content pack")

@api_router.get("/daily", response_model=DailyResponse)
async def get_daily():
    """Get daily seed and timeframe"""
    try:
        seed = generate_daily_seed()
        start, end = get_daily_timeframe()
        
        return DailyResponse(
            seed=seed,
            start=start.isoformat(),
            end=end.isoformat()
        )
    except Exception as e:
        logger.error(f"Error generating daily seed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate daily seed")

@api_router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = 50,
    offset: int = 0,
    daily: bool = False,
    day: Optional[str] = None
):
    """Get leaderboard with pagination"""
    try:
        # Build query
        query = {}
        if daily:
            if day:
                query["day"] = day
            else:
                today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
                query["day"] = today
            query["daily"] = True
        else:
            query["daily"] = False
        
        # Get total count
        total = await db.scores.count_documents(query)
        
        # Get paginated results
        cursor = db.scores.find(query).sort("score", -1).skip(offset).limit(limit)
        scores = await cursor.to_list(length=limit)
        
        # Format response
        rows = [
            LeaderboardEntry(
                username=score.get("username", "Anonymous"),
                score=score["score"],
                depth=score["depth"],
                artifacts=len(score["artifacts"]),
                day=score.get("day"),
                created_at=score["created_at"]
            )
            for score in scores
        ]
        
        return LeaderboardResponse(rows=rows, total=total)
    
    except Exception as e:
        logger.error(f"Error fetching leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch leaderboard")

@api_router.post("/score/submit", response_model=ScoreResponse)
@limiter.limit("10/minute")
async def submit_score(request: Request, submission: ScoreSubmission):
    """Submit and validate score"""
    try:
        # Get active content pack
        content_pack = await get_active_content_pack()
        
        # Validate content version
        if submission.version != content_pack.version:
            raise HTTPException(status_code=400, detail="Content version mismatch")
        
        # Calculate replay digest
        replay_digest = calculate_replay_digest(submission.replayLog)
        
        # Check for duplicate submission
        existing = await db.scores.find_one({"replay_digest": replay_digest})
        if existing:
            raise HTTPException(status_code=400, detail="Score already submitted")
        
        # Validate OneOfOne uniqueness -> 1/1 uniqueness
        for item in submission.items:
            if item.rarity == "1/1":
                existing_item = await db.items.find_one({"hash": item.hash})
                if existing_item:
                    raise HTTPException(status_code=400, detail=f"1/1 item {item.hash} already exists")
        
        # Re-simulate run for validation
        simulator = GameSimulator(content_pack, submission.seed)
        simulation_result = simulator.simulate_run(submission.replayLog)
        
        # Validate client-submitted items match simulation
        if len(submission.items) != len(simulation_result["items"]):
            raise HTTPException(status_code=400, detail="Item count mismatch")
        
        for client_item, sim_item in zip(submission.items, simulation_result["items"]):
            if client_item.hash != sim_item.hash or client_item.rarity != sim_item.rarity:
                raise HTTPException(status_code=400, detail="Item validation failed")
        
        # Use server-calculated score (never trust client)
        validated_score = simulation_result["score"]
        validated_depth = simulation_result["depth"]
        validated_artifacts = simulation_result["artifacts"]
        
        # Create score record
        day = None
        if submission.daily:
            day = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        
        score_record = Score(
            username=submission.username,
            seed=submission.seed,
            version=submission.version,
            daily=submission.daily,
            day=day,
            score=validated_score,
            depth=validated_depth,
            duration_s=0,  # Client could provide this
            artifacts=[item.hash for item in submission.items],
            replay_digest=replay_digest
        )
        
        # Insert score
        await db.scores.insert_one(score_record.dict())
        
        # Register 1/1 items
        for item in simulation_result["items"]:
            if item.rarity == "1/1":
                item_record = Item(
                    hash=item.hash,
                    name=item.name,
                    rarity=item.rarity,
                    set=item.set,
                    effects=item.effects,
                    lore=item.lore
                )
                await db.items.insert_one(item_record.dict())
        
        # Calculate placement
        query = {"daily": submission.daily}
        if submission.daily and day:
            query["day"] = day
        
        placement = await db.scores.count_documents({
            **query,
            "score": {"$gt": validated_score}
        }) + 1
        
        logger.info(f"Score submitted: {validated_score} at depth {validated_depth}")
        
        return ScoreResponse(
            score=validated_score,
            placement=placement,
            depth=validated_depth,
            artifacts=validated_artifacts
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting score: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit score")

@api_router.get("/seed/play")
async def get_custom_seed(seedStr: str):
    """Convert string seed to 64-bit number"""
    try:
        # Hash string to 64-bit number (same as frontend)
        hash_val = 0
        for char in seedStr:
            hash_val = ((hash_val << 5) - hash_val + ord(char)) & 0xffffffff
        
        seed64 = abs(hash_val)
        
        return {
            "seed64": seed64,
            "normalized": seedStr.strip()
        }
    
    except Exception as e:
        logger.error(f"Error processing custom seed: {e}")
        raise HTTPException(status_code=400, detail="Invalid seed string")

# Include router
app.include_router(api_router)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    return {"error": "Internal server error"}

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

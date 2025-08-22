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
    version: str = "1.0.0"
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
    artifacts: List[Artifact] = []
    sets: List[Set] = []
    value_multipliers: Dict[str, float] = {
        "Common": 1, "Uncommon": 1.2, "Rare": 1.5, "Epic": 2, "Mythic": 2.5,
        "Ancient": 3, "Relic": 3.5, "Legendary": 4, "Transcendent": 5, "1/1": 6
    }
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
    seed: str
    version: str
    daily: bool
    replayLog: ReplayLog
    items: List[SubmittedItem]

class Score(BaseModel):
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
            "Ancient": 2000, "Relic": 4000, "Legendary": 8000, "Transcendent": 15000, "OneOfOne": 30000
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
        # Create default content pack
        default_pack = ContentPack()
        default_pack.artifacts = [
            Artifact(
                id="phoenix_feather",
                name="Phoenix Feather",
                rarity="Legendary",
                effects=[ArtifactEffect(id="on_death_revive", v=1)],
                lore="One life, rekindled."
            ),
            Artifact(
                id="lucky_coin",
                name="Lucky Coin",
                rarity="Uncommon",
                effects=[ArtifactEffect(id="loot_chance", v=10)],
                lore="A tarnished coin that brings unexpected fortune."
            ),
            Artifact(
                id="iron_will",
                name="Iron Will",
                rarity="Rare",
                effects=[ArtifactEffect(id="greed_resist", v=1)],
                lore="Strengthens resolve against temptation."
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
        
        # Register OneOfOne items
        for item in simulation_result["items"]:
            if item.rarity == "OneOfOne":
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

@api_router.get("/items/{item_hash}")
async def get_item(item_hash: str):
    """Get item details by hash"""
    try:
        item = await db.items.find_one({"hash": item_hash})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        return Item(**item).dict()
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching item: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch item")

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

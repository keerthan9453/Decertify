import os
import urllib.parse
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# ------------------------------------------------------------------
# Load env vars
# ------------------------------------------------------------------
MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_CLUSTER = os.getenv("MONGO_CLUSTER")
MONGO_DB = os.getenv("MONGO_DB", "hypertuneai")

if not all([MONGO_USERNAME, MONGO_PASSWORD, MONGO_CLUSTER]):
    raise RuntimeError("Missing MongoDB environment variables")

username = urllib.parse.quote_plus(MONGO_USERNAME)
password = urllib.parse.quote_plus(MONGO_PASSWORD)

mongo_uri = (
    f"mongodb+srv://{username}:{password}@{MONGO_CLUSTER}/"
    f"{MONGO_DB}?retryWrites=true&w=majority"
)

# ------------------------------------------------------------------
# Connect
# ------------------------------------------------------------------
try:
    mongo_client = MongoClient(
        mongo_uri,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000,
    )
    mongo_client.admin.command("ping")
except Exception as e:
    raise RuntimeError(f"MongoDB Connection Failed: {e}")

db = mongo_client[MONGO_DB]

# ------------------------------------------------------------------
# Collections (EXPLICIT)
# ------------------------------------------------------------------
users_collection = db["users"]
sessions_collection = db["sessions"]
activity_logs_collection = db["activity_logs"]

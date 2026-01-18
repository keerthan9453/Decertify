from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    UploadFile,
    File,
    Form,
    Request,
)
from datetime import datetime
from bson import ObjectId
from multiprocessing import Process, Queue
import json
import os
import tempfile
from amplitude import Amplitude, BaseEvent
from app.database import users_collection, sessions_collection
from app.utils.security import get_current_user_id
from app.utils.activity_logger import log_activity
from app.storage.s3 import s3
from app.coordinator.coordinator import run_coordinator
from app.workers.peer_worker import peer_worker
from app.workers.registry import workers
import requests
import google.generativeai as genai
router = APIRouter(prefix="/sessions", tags=["sessions"])

S3_BUCKET = os.getenv("S3_BUCKET_NAME")
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-3-flash-preview")
# Name of the heartbeat worker process
HEARTBEAT_WORKER = "heartbeat-worker"


AMPLITUDE_API_KEY = os.getenv("AMPLITUDE_API_KEY")
AMPLITUDE_URL = "https://api2.amplitude.com/2/httpapi"
print("AMPLITUDE_API_KEY:", AMPLITUDE_API_KEY)



def track_event(
    *,
    event_type: str,
    user_id: str,
    session_id: str | None = None,
    props: dict | None = None,
):
    assert AMPLITUDE_API_KEY, "AMPLITUDE_API_KEY is missing"

    payload = {
        "api_key": AMPLITUDE_API_KEY,
        "events": [
            {
                "user_id": str(user_id),
                "event_type": event_type,
                "time": int(datetime.utcnow().timestamp() * 1000),
                "event_properties": {
                    **({"session_id": session_id} if session_id else {}),
                    **(props or {}),
                },
            }
        ],
    }

    try:
        response = requests.post(
            AMPLITUDE_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5,
        )

        print("Amplitude status:", response.status_code)
        print("Amplitude response:", response.text)

    except Exception as e:
        print("Amplitude request failed:", e)

@router.get("/amplitude-test")
async def amplitude_test():
    track_event(
        event_type="amplitude_test_event",
        user_id="debug_user_123",
        props={"source": "fastapi"}
    )
    return {"ok": True}

# ------------------------------------------------------------------
# Helper: generate command queue name
# ------------------------------------------------------------------


def user_command_queue(session_uid: str) -> str:
    """
    Generates a command queue name for a given session/user.
    """
    return f"peer.{session_uid}.command"

# ------------------------------------------------------------------
# Background process: upload CSV → update session → start coordinator
# ------------------------------------------------------------------


def upload_and_start_coordinator(
    temp_file_path: str,
    original_filename: str,
    session_id: str,
    coordinator_uid: str,
):
    """
    Runs in a separate OS process.

    1. Upload CSV to S3
    2. Update session with dataset metadata
    3. Start coordinator (blocking inside its own process)
    """

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    s3_key = f"{timestamp}.dataset.csv"

    # 1. Upload CSV
    s3.upload_file(
        temp_file_path,
        S3_BUCKET,
        s3_key,
        ExtraArgs={"ContentType": "text/csv"},
    )

    # 2. Update session dataset metadata
    sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "dataset": {
                    "s3_bucket": S3_BUCKET,
                    "s3_key": s3_key,
                    "original_filename": original_filename,
                }
            }
        },
    )
    # 3. Start coordinator (long-running)
    run_coordinator(session_id, coordinator_uid)

    # 4. Cleanup temp file
    try:
        os.remove(temp_file_path)
    except Exception:
        pass

# ------------------------------------------------------------------
# GET: List all sessions for the current user
# ------------------------------------------------------------------


@router.get("")
async def get_sessions(user_id: str = Depends(get_current_user_id)):
    """
    Returns all sessions owned by or joined by the current user.
    """
    try:
        user_oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = users_collection.find_one({"_id": user_oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get owned sessions
    owned_session_ids = user.get("owned_sessions", [])
    owned_sessions = list(
        sessions_collection.find({"_id": {"$in": owned_session_ids}})
    )

    # Get joined sessions
    joined_session_ids = user.get("joined_sessions", [])
    joined_sessions = list(
        sessions_collection.find({"_id": {"$in": joined_session_ids}})
    )

    # Convert ObjectId to string for JSON serialization
    for session in owned_sessions + joined_sessions:
        session["_id"] = str(session["_id"])
        session["owner_user_id"] = str(session.get("owner_user_id", ""))

    return {
        "owned_sessions": owned_sessions,
        "joined_sessions": joined_sessions,
    }


# ------------------------------------------------------------------
# GET: Session details by ID
# ------------------------------------------------------------------
@router.get("/{session_id}")
async def get_session_details(
    session_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Returns detailed information about a specific session.
    User must be either the owner or a participant.
    """
    try:
        user_oid = ObjectId(user_id)
        session_oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    session = sessions_collection.find_one({"_id": session_oid})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check authorization: user must be owner or participant
    owner_id = session.get("owner_user_id")
    peer_ids = [peer.get("uid") for peer in session.get("peers", [])]

    if str(user_oid) != owner_id and str(user_oid) not in peer_ids:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this session"
        )

    # Convert ObjectId to string for JSON serialization
    session["_id"] = str(session["_id"])
    session["owner_user_id"] = str(session.get("owner_user_id", ""))

    return session

# ------------------------------------------------------------------
# Start session endpoint
# ------------------------------------------------------------------

@router.post("/start")
async def start_session(
    num_peers: int = Form(...),
    hyperparameters: str = Form(...),
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    """
    Creates a session and starts training asynchronously.
    """

    # ----------------------------
    # Validate owner
    # ----------------------------
    try:
        owner_oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    owner = users_collection.find_one({"_id": owner_oid})
    if not owner:
        raise HTTPException(status_code=404, detail="User not found")

    # ----------------------------
    # Parse hyperparameters
    # ----------------------------
    try:
        hyperparams_list = json.loads(hyperparameters)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400, detail="Hyperparameters must be valid JSON"
        )

    if not isinstance(hyperparams_list, list) or len(hyperparams_list) != num_peers:
        raise HTTPException(
            status_code=400,
            detail="Hyperparameters list must match num_peers",
        )

    # ----------------------------
    # Find available peers
    # ----------------------------
    available_users = list(
        users_collection.find(
            {"status": "ONLINE", "_id": {"$ne": owner_oid}}
        ).limit(num_peers)
    )

    if len(available_users) < num_peers:
        raise HTTPException(
            status_code=400,
            detail="Not enough online peers available",
        )

    # ----------------------------
    # Create session
    # ----------------------------
    session_id = ObjectId()
    peers = {}
    results = {}

    for i, user in enumerate(available_users):
        peer_uid = str(user["_id"])
        peers[peer_uid] = {
            "uid": peer_uid,
            "peer_queue": f"peer.{peer_uid}.command",
            "status": "TRAINING",
            "results": [],
            "hyperparameters": hyperparams_list[i],
        }
        results[peer_uid] = []

        # Lock peer
        users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"status": "TRAINING"},
                "$addToSet": {"joined_sessions": session_id},
            },
        )

    # ----------------------------
    # Update owner (coordinator) status
    # ----------------------------
    users_collection.update_one(
        {"_id": owner_oid},
        {
            "$set": {"status": "COORDINATOR_RUNNING"},
            "$addToSet": {"owned_sessions": session_id},
        },
    )
    log_activity(
    user_id=user_id,
    action="START_SESSION",
    session_id=str(session_id),
    metadata={"num_peers": num_peers}
    )


    # ----------------------------
    # Insert session document
    # ----------------------------
    session_doc = {
        "_id": session_id,
        "owner_user_id": str(owner_oid),
        "num_peers": num_peers,
        "dataset": {},  # will be updated after file upload
        "hyperparameters": hyperparams_list,
        "status": "RUNNING",
        "created_at": datetime.utcnow(),
        "started_at": datetime.utcnow(),
        "completed_at": None,
        "peers": list(peers.values()),
        "results": results,
    }

    sessions_collection.insert_one(session_doc)

    track_event(
        event_type="Start_Session",
        user_id=user_id,
        session_id=str(session_id),
        props={"num_peers": num_peers}
    )


    # ----------------------------
    # Save uploaded file locally
    # ----------------------------
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        temp_file_path = tmp.name
        tmp.write(await file.read())

    # ----------------------------
    # Spawn background coordinator
    # ----------------------------
    Process(
        target=upload_and_start_coordinator,
        args=(
            temp_file_path,
            file.filename,
            str(session_id),
            str(owner_oid),
        ),
        daemon=True,
    ).start()

    return {
        "message": "Session started. Uploading dataset & starting coordinator.",
        "session_uid": str(session_id),
        "assigned_peers": list(peers.values()),
    }

# ------------------------------------------------------------------
# Join session endpoint
# ------------------------------------------------------------------


@router.post("/join")
async def join_session(user_id: str = Depends(get_current_user_id)):
    """
    Start the heartbeat worker AND mark user as ONLINE.
    """

    try:
        mongo_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")
    
    log_activity(
        user_id=user_id,
        action="JOIN"
    )

    print("ADDED AN EVENT BOI")

    user = users_collection.find_one({"_id": mongo_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if HEARTBEAT_WORKER in workers:
        return {"message": "Heartbeat worker already running"}

    session_uid = user_id
    command_queue_name = user_command_queue(session_uid)
    control_queue = Queue()

    process = Process(
        target=peer_worker,
        args=(
            HEARTBEAT_WORKER,
            session_uid,
            command_queue_name,
            control_queue,
        ),
        daemon=True,
    )
    process.start()

    users_collection.update_one(
        {"_id": mongo_id},
        {
            "$set": {
                "status": "ONLINE",
                "last_online_at": datetime.utcnow(),
            }
        }
    )

    workers[HEARTBEAT_WORKER] = {
        "process": process,
        "control_queue": control_queue,
        "command_queue": command_queue_name,
        "session_uid": session_uid,
        "started_at": datetime.utcnow(),
    }

    return {
        "message": "Peer is ONLINE",
        "process_uid": HEARTBEAT_WORKER,
        "session_uid": session_uid,
        "command_queue": command_queue_name,
        "pid": process.pid,
    }

# ------------------------------------------------------------------
# Send command to worker
# ------------------------------------------------------------------


@router.post("/command")
async def send_command(
    command: str,
    user_id: str = Depends(get_current_user_id),
):
    """
    Send a control command to the worker.
    """

    worker = workers.get(HEARTBEAT_WORKER)
    if not worker:
        raise HTTPException(
            status_code=400,
            detail="Heartbeat worker not running",
        )

    worker["control_queue"].put(command)

    return {
        "process_uid": HEARTBEAT_WORKER,
        "command": command,
        "status": "sent",
    }

# ------------------------------------------------------------------
# Leave session (stop worker)
# ------------------------------------------------------------------


@router.post("/leave")
async def leave_session(user_id: str = Depends(get_current_user_id)):
    mongo_id = ObjectId(user_id)

    # ----------------------------
    # Stop heartbeat worker
    # ----------------------------
    worker = workers.get(HEARTBEAT_WORKER)
    if worker:
        worker["control_queue"].put("STOP")
        del workers[HEARTBEAT_WORKER]

    # ----------------------------
    # Update user status → OFFLINE
    # ----------------------------
    users_collection.update_one(
        {"_id": mongo_id},
        {
            "$set": {
                "status": "OFFLINE",
                "last_online_at": datetime.utcnow()
            }
        }
    )

    log_activity(
    user_id=user_id,
    action="LEAVE")


    return {"message": "User is now OFFLINE and worker stopped"}

# ------------------------------------------------------------------
# Check training status (user-scoped)
# ------------------------------------------------------------------


@router.get("/training-status")
async def get_training_status(user_id: str = Depends(get_current_user_id)):
    """
    Returns whether the latest session the user joined is still running.

    - If session is RUNNING → "training is going on"
    - Otherwise → "training is completed"
    """
    try:
        user_oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = users_collection.find_one({"_id": user_oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    joined_sessions = user.get("joined_sessions", [])
    if not joined_sessions:
        return {"message": "Waiting to Join Session"}

    latest_session_id = joined_sessions[-1]
    session = sessions_collection.find_one({"_id": latest_session_id})
    if not session:
        return {"message": "Session not found"}

    status = session.get("status", "UNKNOWN")
    if status == "RUNNING":
        return {"status": "training is going on"}
    else:
        return {"status": "training is completed"}
# ------------------------------------------------------------------
# GET: Session results with hyperparameters for plotting
# ------------------------------------------------------------------
@router.get("/{session_id}/full-results")
async def get_full_results(session_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Returns all peers in the session with their nested epoch results
    suitable for plotting line graphs per peer.
    """

    # Validate IDs
    try:
        session_oid = ObjectId(session_id)
        user_oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session or user ID")

    # Fetch session
    session = sessions_collection.find_one({"_id": session_oid})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Authorization: owner or participant
    owner_id = session.get("owner_user_id")
    peer_ids = [peer.get("uid") for peer in session.get("peers", [])]

    if str(user_oid) != owner_id and str(user_oid) not in peer_ids:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")

    # Build nested results per peer
    full_results = {}
    for peer in session.get("peers", []):
        peer_uid = peer.get("uid")
        full_results[peer_uid] = {
            "hyperparameters": peer.get("hyperparameters", {}),
            "epochs": peer.get("results", [])
        }

    return {
        "session_id": str(session_oid),
        "status": session.get("status"),
        "peers": full_results
    }

@router.post("/explain")
async def explain_hyperparameters(request: Request):
    """
    Takes a single hyperparameter JSON object and returns
    a human-readable explanation from Gemini.
    """

    try:
        hp = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    prompt = f"""
You are an ML teaching assistant.

Explain the following training hyperparameters in simple,
clear language for a student.

Hyperparameters:
{hp}

Explain:
- What this configuration is trying to do
- The trade-offs involved
- When someone should use it

Keep it short and beginner-friendly.
"""

    try:
        response = model.generate_content(prompt)

        return {
            "explanation": response.text.strip()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API error: {str(e)}"
        )
    
@router.get("/peers/online")
async def get_online_peers(user_id: str = Depends(get_current_user_id)):
    """
    Returns how many peers are currently ONLINE.
    """

    online_count = users_collection.count_documents(
        {"status": "ONLINE"}
    )

    track_event(
        event_type="View_Online_Peers",
        user_id=user_id,
        props={"online_peers": online_count}
    )

    return {
        "online_peers": online_count
    }

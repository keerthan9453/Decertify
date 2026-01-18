from datetime import datetime
from bson import ObjectId
from app.database import activity_logs_collection


def log_activity(
    *,
    user_id: str,
    action: str,
    session_id: str | None = None,
    metadata: dict | None = None,
):
    """
    Persist user activity in MongoDB for auditing & analytics.
    """
    activity_logs_collection.insert_one({
        "user_id": ObjectId(user_id),
        "action": action,  # JOIN | START_SESSION | LEAVE
        "session_id": ObjectId(session_id) if session_id else None,
        "metadata": metadata or {},
        "created_at": datetime.utcnow(),
        "day": datetime.utcnow().strftime("%Y-%m-%d"),
        "time": datetime.utcnow().strftime("%H:%M:%S"),
    })

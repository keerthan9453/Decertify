from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.database import users_collection
from app.models import SignupRequest, SigninRequest
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.utils.activity_logger import log_activity
from app.utils.system_specs import get_system_specs

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
def signup(data: SignupRequest):
    # Check if email already exists
    if users_collection.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="User already exists")

    specs = get_system_specs()

    user = {
        "username": data.username,
        "email": data.email,
        "phone_number": data.phone_number,  # <-- new field
        "password": hash_password(data.password),
        "specs": specs,
        "status": "OFFLINE",
        "owned_sessions": [],
        "joined_sessions": [],
        "listened_queue": None,
        "created_at": datetime.utcnow(),
    }

    users_collection.insert_one(user)

    return {
        "message": "Signup successful"
    }


@router.post("/signin")
def signin(data: SigninRequest):
    user = users_collection.find_one({"email": data.email})

    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    log_activity(
        user_id=str(user["_id"]),
        action="user_signed_in",
        metadata={
            "email": user["email"]
        }
    )

    token = create_access_token(
        {
            "sub": str(user["_id"]),
            "email": user["email"],
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
    }

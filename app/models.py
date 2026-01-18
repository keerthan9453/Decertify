from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Any, Optional, List


# ============================================================================
# Auth schemas
# ============================================================================

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    phone_number: str  # <-- add this


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


# ============================================================================
# Session schemas
# ============================================================================

class CreateSessionMetadata(BaseModel):
    """
    Metadata for creating a session.

    NOTE:
    - CSV file and hyperparameters are sent via multipart/form-data
    - This model is for validation / documentation only
    """
    num_peers: int = Field(..., ge=1, le=100)
    name: Optional[str] = None


class SessionDB(BaseModel):
    """
    Logical shape of a session document stored in MongoDB.
    """
    session_id: str
    owner_user_id: str
    num_peers: int
    dataset_s3_key: str
    hyperparameters: List[Dict[str, Any]]
    status: str


class CreateSessionResponse(BaseModel):
    """
    Response returned after creating a session.
    """
    session_uid: str
    num_peers: int
    dataset_s3_key: str

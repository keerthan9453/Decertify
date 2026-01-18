from fastapi import FastAPI
from app.routers.auth import router as auth_router
app = FastAPI(
    title="Distributed Compute Controller",
    version="0.1.0"
)
app.include_router(auth_router)
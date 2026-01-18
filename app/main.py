from fastapi import FastAPI
from app.routes import auth
from app.routes import sessions
from fastapi.middleware.cors import CORSMiddleware
from app.routes.sessions import router as sessions_router
app = FastAPI()
app.include_router(sessions_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(auth.router)
app.include_router(sessions.router)

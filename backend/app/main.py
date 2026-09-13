from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import trees

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en dev seulement, on restreindra plus tard
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trees.router)

@app.get("/health")
def health():
    return {"status": "ok"}
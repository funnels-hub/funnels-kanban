import os
from dotenv import load_dotenv
load_dotenv("backend/.env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.columns.router import router as columns_router
from backend.cards.router import router as cards_router
from backend.templates.router import router as templates_router
from backend.boards.router import router as boards_router
from backend.auth.router import router as auth_router
from backend.hospitals.router import router as hospitals_router

app = FastAPI(title="치과 상담 예약 칸반 API", version="0.1.0")

cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(columns_router)
app.include_router(cards_router)
app.include_router(templates_router)
app.include_router(boards_router)
app.include_router(auth_router)
app.include_router(hospitals_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=9000, reload=True)

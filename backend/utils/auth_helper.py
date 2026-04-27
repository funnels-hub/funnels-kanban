import os
from datetime import datetime, timedelta, timezone
from typing import TypedDict

import jwt
from fastapi import HTTPException, Request

from backend.conn import RealDictCursor, get_db_connection

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALG = "HS256"
JWT_EXP_HOURS = 24


class CurrentHospital(TypedDict):
    id: str
    email: str
    name: str
    is_admin: bool
    is_active: bool


def create_access_token(hospital_id: str, email: str, is_admin: bool) -> str:
    """JWT 발급. payload: sub=hospital_id, email, is_admin, exp, iat."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": hospital_id,
        "email": email,
        "is_admin": is_admin,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_EXP_HOURS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def get_current_hospital(request: Request) -> CurrentHospital:
    """Authorization: Bearer 헤더에서 JWT 검증, hospitals 테이블에서 행 조회. 비활성 시 401."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    hospital_id = payload.get("sub")
    if not hospital_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, email, name, is_admin, is_active FROM hospitals WHERE id = %s",
            (hospital_id,),
        )
        row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Hospital not found")
    if not row["is_active"]:
        raise HTTPException(status_code=401, detail="Hospital is deactivated")

    return CurrentHospital(
        id=row["id"],
        email=row["email"],
        name=row["name"],
        is_admin=row["is_admin"],
        is_active=row["is_active"],
    )


def require_admin(current: CurrentHospital) -> None:
    """Admin 권한 검사. 미admin 시 403."""
    if not current["is_admin"]:
        raise HTTPException(status_code=403, detail="Admin required")

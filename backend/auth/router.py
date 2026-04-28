from fastapi import APIRouter, Depends, HTTPException

from auth.login import main as login_main
from auth.me import main as me_main
from auth.model import AuthResponse, HospitalPublic, LoginRequest
from utils.auth_helper import CurrentHospital, get_current_hospital

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    try:
        return login_main(body.email, body.password)
    except ValueError as e:
        msg = str(e)
        if "INVALID_CREDENTIALS" in msg:
            raise HTTPException(401, "이메일 또는 비밀번호가 올바르지 않습니다")
        if "DEACTIVATED" in msg:
            raise HTTPException(401, "비활성화된 계정입니다")
        raise HTTPException(400, msg)


@router.get("/me", response_model=HospitalPublic)
async def me(current: CurrentHospital = Depends(get_current_hospital)):
    return me_main(current["id"])

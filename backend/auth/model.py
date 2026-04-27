from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1)


class HospitalPublic(BaseModel):
    id: str
    name: str
    email: str
    is_admin: bool


class AuthResponse(BaseModel):
    access_token: str
    hospital: HospitalPublic

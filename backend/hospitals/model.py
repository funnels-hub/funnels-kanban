from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class Hospital(BaseModel):
    id: str
    name: str
    email: str
    is_admin: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class HospitalCreate(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=4)


class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=4)
    is_active: Optional[bool] = None

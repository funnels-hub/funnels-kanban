from datetime import date as date_type
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class TemplateColumnItem(BaseModel):
    id: str
    label: str


class TemplateLeafItem(BaseModel):
    id: str
    row1_id: str
    label: str


class Template(BaseModel):
    id: str
    name: str
    row1: List[TemplateColumnItem]
    row2: List[TemplateLeafItem]
    is_default: bool
    created_at: datetime
    updated_at: datetime


class TemplateCreate(BaseModel):
    name: str
    source_date: Optional[date_type] = None


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    row1: Optional[List[TemplateColumnItem]] = None
    row2: Optional[List[TemplateLeafItem]] = None
    is_default: Optional[bool] = None

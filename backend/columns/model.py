from datetime import date as date_type
from typing import Dict, List, Optional

from pydantic import BaseModel


class ColumnRow1(BaseModel):
    id: str
    date: date_type
    label: str
    position: int
    built_in: bool


class ColumnRow1Create(BaseModel):
    label: str
    position: Optional[int] = None


class ColumnRow1Update(BaseModel):
    label: Optional[str] = None
    position: Optional[int] = None


class ColumnRow2(BaseModel):
    id: str
    date: date_type
    row1_id: str
    label: str
    position: int
    built_in: bool


class ColumnRow2Create(BaseModel):
    row1_id: str
    label: str
    position: Optional[int] = None


class ColumnRow2Update(BaseModel):
    label: Optional[str] = None
    position: Optional[int] = None
    row1_id: Optional[str] = None


class ColumnsBundle(BaseModel):
    date: date_type
    row1: List[ColumnRow1]
    row2: List[ColumnRow2]


class ReorderRequest(BaseModel):
    row1_ids: Optional[List[str]] = None
    row2_ids: Optional[Dict[str, List[str]]] = None

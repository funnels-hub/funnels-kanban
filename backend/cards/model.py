from datetime import date as Date, datetime
from pydantic import BaseModel, Field

TIME_SLOT_PATTERN = r"^([0-9]|0[0-9]|1[0-9]|2[0-3]):(00|30)$"
HHMM_OR_EMPTY_PATTERN = r"^$|^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"


class Card(BaseModel):
    id: str
    date: Date
    row1_id: str
    row2_id: str
    time: str = Field(pattern=TIME_SLOT_PATTERN)
    name: str
    chart: str
    counselor: str
    book_time: str = Field(pattern=HHMM_OR_EMPTY_PATTERN)
    consult_time: str
    memo: str
    color: str
    created_at: datetime
    updated_at: datetime


class CardCreate(BaseModel):
    date: Date
    row1_id: str
    row2_id: str
    time: str = Field(pattern=TIME_SLOT_PATTERN)
    name: str = ""
    chart: str = ""
    counselor: str = ""
    book_time: str = Field(default="", pattern=HHMM_OR_EMPTY_PATTERN)
    consult_time: str = ""
    memo: str = ""
    color: str = ""


class CardUpdate(BaseModel):
    name: str | None = None
    chart: str | None = None
    counselor: str | None = None
    book_time: str | None = Field(default=None, pattern=HHMM_OR_EMPTY_PATTERN)
    consult_time: str | None = None
    memo: str | None = None
    color: str | None = None
    sync_siblings: bool = True


class CardMove(BaseModel):
    time: str | None = Field(default=None, pattern=TIME_SLOT_PATTERN)
    row1_id: str | None = None
    row2_id: str | None = None

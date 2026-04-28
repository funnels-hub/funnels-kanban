from datetime import date as date_type
from typing import Any, Dict, List

from pydantic import BaseModel

from cards.model import Card
from columns.model import ColumnsBundle


class BoardSnapshot(BaseModel):
    date: date_type
    columns: ColumnsBundle
    cards: List[Card]


class ApplyTemplateRequest(BaseModel):
    template_id: str


class ImplantLeafCount(BaseModel):
    label: str
    count: int


class ImplantStats(BaseModel):
    date: date_type
    total: int
    by_leaf: Dict[str, ImplantLeafCount]


class Defaults(BaseModel):
    row1: List[Dict[str, Any]]
    row2: List[Dict[str, Any]]
    counselors: List[str]
    time_slots: List[str]
    r1_leaf_width: Dict[str, int]
    single_card_r1: List[str]
    dup_allowed_r1: List[str]
    color_palette: List[str]

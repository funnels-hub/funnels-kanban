from fastapi import APIRouter, HTTPException

from backend.cards.create_card import main as create_card_main
from backend.cards.delete_card import main as delete_card_main
from backend.cards.get_by_chart import main as get_by_chart_main
from backend.cards.implant_stats import main as implant_stats_main
from backend.cards.list_cards import main as list_cards_main
from backend.cards.model import CardCreate, CardMove, CardUpdate
from backend.cards.move_card import main as move_card_main
from backend.cards.update_card import main as update_card_main

router = APIRouter(prefix="/api", tags=["cards"])


def _handle(e: ValueError):
    msg = str(e)
    if "NOT_FOUND" in msg:
        raise HTTPException(404, msg)
    if any(k in msg for k in ["CHART_ALREADY_EXISTS", "CELL_OCCUPIED"]):
        raise HTTPException(409, msg)
    raise HTTPException(400, msg)


@router.get("/cards/by-chart")
async def get_by_chart_endpoint(chart: str, date: str | None = None):
    try:
        return get_by_chart_main(chart, date)
    except ValueError as e:
        _handle(e)


@router.get("/stats/implant")
async def implant_stats_endpoint(date: str):
    try:
        return implant_stats_main(date)
    except ValueError as e:
        _handle(e)


@router.get("/cards")
async def list_cards_endpoint(date: str):
    try:
        return list_cards_main(date)
    except ValueError as e:
        _handle(e)


@router.post("/cards")
async def create_card_endpoint(body: CardCreate):
    try:
        return create_card_main(
            str(body.date),
            body.row1_id,
            body.row2_id,
            body.time,
            body.name if body.name is not None else "",
            body.chart if body.chart is not None else "",
            body.counselor if body.counselor is not None else "",
            body.book_time if body.book_time is not None else "",
            body.consult_time if body.consult_time is not None else "",
            body.memo if body.memo is not None else "",
            body.color if body.color is not None else "",
        )
    except ValueError as e:
        _handle(e)


@router.patch("/cards/{card_id}/move")
async def move_card_endpoint(card_id: str, body: CardMove):
    try:
        return move_card_main(card_id, body.time, body.row1_id, body.row2_id)
    except ValueError as e:
        _handle(e)


@router.patch("/cards/{card_id}")
async def update_card_endpoint(card_id: str, body: CardUpdate):
    try:
        return update_card_main(
            card_id,
            body.name,
            body.chart,
            body.counselor,
            body.book_time,
            body.consult_time,
            body.memo,
            body.color,
            body.sync_siblings,
        )
    except ValueError as e:
        _handle(e)


@router.delete("/cards/{card_id}")
async def delete_card_endpoint(card_id: str):
    try:
        return delete_card_main(card_id)
    except ValueError as e:
        _handle(e)

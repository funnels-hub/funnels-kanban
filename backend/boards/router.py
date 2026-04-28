from fastapi import APIRouter, Depends, HTTPException

from boards.apply_template import main as apply_template_main
from boards.get_board import main as get_board_main
from boards.model import ApplyTemplateRequest
from utils.auth_helper import CurrentHospital, get_current_hospital
from utils.defaults import (
    COLOR_PALETTE,
    COUNSELORS,
    DEFAULT_ROW1,
    DEFAULT_ROW2,
    DUP_ALLOWED_R1,
    R1_LEAF_WIDTH,
    SINGLE_CARD_R1,
    TIME_SLOTS,
)

router = APIRouter(prefix="/api", tags=["boards"])


def _handle(e: ValueError):
    msg = str(e)
    if "NOT_FOUND" in msg:
        raise HTTPException(404, msg)
    raise HTTPException(400, msg)


@router.get("/boards/{date}")
async def get_board_endpoint(
    date: str,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return get_board_main(current["id"], date)
    except ValueError as e:
        _handle(e)


@router.post("/boards/{date}/apply-template")
async def apply_template_endpoint(
    date: str,
    body: ApplyTemplateRequest,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return apply_template_main(current["id"], date, body.template_id)
    except ValueError as e:
        _handle(e)


@router.get("/defaults")
async def get_defaults(
    current: CurrentHospital = Depends(get_current_hospital),
):
    return {
        "row1": list(DEFAULT_ROW1),
        "row2": list(DEFAULT_ROW2),
        "counselors": list(COUNSELORS),
        "time_slots": list(TIME_SLOTS),
        "r1_leaf_width": dict(R1_LEAF_WIDTH),
        "single_card_r1": list(SINGLE_CARD_R1),
        "dup_allowed_r1": list(DUP_ALLOWED_R1),
        "color_palette": list(COLOR_PALETTE),
    }

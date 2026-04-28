from fastapi import APIRouter, Depends, HTTPException

from columns.add_row1 import main as add_row1_main
from columns.add_row2 import main as add_row2_main
from columns.delete_row1 import main as delete_row1_main
from columns.delete_row2 import main as delete_row2_main
from columns.get_columns import main as get_columns_main
from columns.model import (
    ColumnRow1Create,
    ColumnRow1Update,
    ColumnRow2Create,
    ColumnRow2Update,
    ReorderRequest,
)
from columns.rename_row1 import main as rename_row1_main
from columns.rename_row2 import main as rename_row2_main
from columns.reorder import main as reorder_main
from utils.auth_helper import CurrentHospital, get_current_hospital

router = APIRouter(prefix="/api/columns", tags=["columns"])


def _handle(e: ValueError):
    msg = str(e)
    if "NOT_FOUND" in msg:
        raise HTTPException(404, msg)
    if any(
        k in msg
        for k in ["LAST_LEAF", "CONFLICT", "OCCUPIED", "ALREADY_EXISTS", "PROTECTED"]
    ):
        raise HTTPException(409, msg)
    raise HTTPException(400, msg)


@router.get("/{date}")
async def get_columns_endpoint(
    date: str,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return get_columns_main(current["id"], date)
    except ValueError as e:
        _handle(e)


@router.post("/{date}/row1")
async def add_row1_endpoint(
    date: str,
    body: ColumnRow1Create,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return add_row1_main(current["id"], date, body.label, body.position)
    except ValueError as e:
        _handle(e)


@router.patch("/{date}/row1/{r1_id}")
async def rename_row1_endpoint(
    date: str,
    r1_id: str,
    body: ColumnRow1Update,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return rename_row1_main(current["id"], date, r1_id, body.label, body.position)
    except ValueError as e:
        _handle(e)


@router.delete("/{date}/row1/{r1_id}")
async def delete_row1_endpoint(
    date: str,
    r1_id: str,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return delete_row1_main(current["id"], date, r1_id)
    except ValueError as e:
        _handle(e)


@router.post("/{date}/row2")
async def add_row2_endpoint(
    date: str,
    body: ColumnRow2Create,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return add_row2_main(
            current["id"], date, body.row1_id, body.label, body.position
        )
    except ValueError as e:
        _handle(e)


@router.patch("/{date}/row2/{r2_id}")
async def rename_row2_endpoint(
    date: str,
    r2_id: str,
    body: ColumnRow2Update,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return rename_row2_main(
            current["id"],
            date,
            r2_id,
            label=body.label,
            position=body.position,
            row1_id=body.row1_id,
        )
    except ValueError as e:
        _handle(e)


@router.delete("/{date}/row2/{r2_id}")
async def delete_row2_endpoint(
    date: str,
    r2_id: str,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return delete_row2_main(current["id"], date, r2_id)
    except ValueError as e:
        _handle(e)


@router.put("/{date}/reorder")
async def reorder_endpoint(
    date: str,
    body: ReorderRequest,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return reorder_main(current["id"], date, body.row1_ids, body.row2_ids)
    except ValueError as e:
        _handle(e)

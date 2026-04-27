from fastapi import APIRouter, HTTPException

from backend.columns.add_row1 import main as add_row1_main
from backend.columns.add_row2 import main as add_row2_main
from backend.columns.delete_row1 import main as delete_row1_main
from backend.columns.delete_row2 import main as delete_row2_main
from backend.columns.get_columns import main as get_columns_main
from backend.columns.model import (
    ColumnRow1Create,
    ColumnRow1Update,
    ColumnRow2Create,
    ColumnRow2Update,
    ReorderRequest,
)
from backend.columns.rename_row1 import main as rename_row1_main
from backend.columns.rename_row2 import main as rename_row2_main
from backend.columns.reorder import main as reorder_main

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
async def get_columns_endpoint(date: str):
    try:
        return get_columns_main(date)
    except ValueError as e:
        _handle(e)


@router.post("/{date}/row1")
async def add_row1_endpoint(date: str, body: ColumnRow1Create):
    try:
        return add_row1_main(date, body.label, body.position)
    except ValueError as e:
        _handle(e)


@router.patch("/{date}/row1/{r1_id}")
async def rename_row1_endpoint(date: str, r1_id: str, body: ColumnRow1Update):
    try:
        return rename_row1_main(date, r1_id, body.label, body.position)
    except ValueError as e:
        _handle(e)


@router.delete("/{date}/row1/{r1_id}")
async def delete_row1_endpoint(date: str, r1_id: str):
    try:
        return delete_row1_main(date, r1_id)
    except ValueError as e:
        _handle(e)


@router.post("/{date}/row2")
async def add_row2_endpoint(date: str, body: ColumnRow2Create):
    try:
        return add_row2_main(date, body.row1_id, body.label, body.position)
    except ValueError as e:
        _handle(e)


@router.patch("/{date}/row2/{r2_id}")
async def rename_row2_endpoint(date: str, r2_id: str, body: ColumnRow2Update):
    try:
        return rename_row2_main(
            date,
            r2_id,
            label=body.label,
            position=body.position,
            row1_id=body.row1_id,
        )
    except ValueError as e:
        _handle(e)


@router.delete("/{date}/row2/{r2_id}")
async def delete_row2_endpoint(date: str, r2_id: str):
    try:
        return delete_row2_main(date, r2_id)
    except ValueError as e:
        _handle(e)


@router.put("/{date}/reorder")
async def reorder_endpoint(date: str, body: ReorderRequest):
    try:
        return reorder_main(date, body.row1_ids, body.row2_ids)
    except ValueError as e:
        _handle(e)

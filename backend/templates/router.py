from fastapi import APIRouter, Depends, HTTPException

from backend.templates.create_template import main as create_template_main
from backend.templates.delete_template import main as delete_template_main
from backend.templates.duplicate_template import main as duplicate_template_main
from backend.templates.get_template import main as get_template_main
from backend.templates.list_templates import main as list_templates_main
from backend.templates.model import TemplateCreate, TemplateUpdate
from backend.templates.update_template import main as update_template_main
from backend.utils.auth_helper import CurrentHospital, get_current_hospital

router = APIRouter(prefix="/api/templates", tags=["templates"])


def _handle(e: ValueError):
    msg = str(e)
    if "NOT_FOUND" in msg:
        raise HTTPException(404, msg)
    if "CANNOT_DELETE_DEFAULT" in msg or "DEFAULT_REQUIRED" in msg:
        raise HTTPException(409, msg)
    raise HTTPException(400, msg)


@router.get("")
async def list_templates_endpoint(
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return list_templates_main(current["id"])
    except ValueError as e:
        _handle(e)


@router.post("")
async def create_template_endpoint(
    body: TemplateCreate,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        source_date = body.source_date.isoformat() if body.source_date else None
        return create_template_main(current["id"], body.name, source_date)
    except ValueError as e:
        _handle(e)


@router.get("/{tpl_id}")
async def get_template_endpoint(
    tpl_id: str,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return get_template_main(current["id"], tpl_id)
    except ValueError as e:
        _handle(e)


@router.patch("/{tpl_id}")
async def update_template_endpoint(
    tpl_id: str,
    body: TemplateUpdate,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        row1 = [r.model_dump() for r in body.row1] if body.row1 is not None else None
        row2 = [r.model_dump() for r in body.row2] if body.row2 is not None else None
        return update_template_main(
            current["id"], tpl_id, body.name, row1, row2, body.is_default
        )
    except ValueError as e:
        _handle(e)


@router.delete("/{tpl_id}")
async def delete_template_endpoint(
    tpl_id: str,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return delete_template_main(current["id"], tpl_id)
    except ValueError as e:
        _handle(e)


@router.post("/{tpl_id}/duplicate")
async def duplicate_template_endpoint(
    tpl_id: str,
    current: CurrentHospital = Depends(get_current_hospital),
):
    try:
        return duplicate_template_main(current["id"], tpl_id)
    except ValueError as e:
        _handle(e)

from fastapi import APIRouter, Depends, HTTPException

from hospitals.create_hospital import main as create_main
from hospitals.delete_hospital import main as delete_main
from hospitals.list_hospitals import main as list_main
from hospitals.model import Hospital, HospitalCreate, HospitalUpdate
from hospitals.update_hospital import main as update_main
from utils.auth_helper import CurrentHospital, get_current_hospital, require_admin

router = APIRouter(prefix="/api/admin/hospitals", tags=["admin"])


def _admin(current: CurrentHospital = Depends(get_current_hospital)) -> CurrentHospital:
    require_admin(current)
    return current


def _handle(e: ValueError):
    msg = str(e)
    if "NOT_FOUND" in msg:
        raise HTTPException(404, msg)
    if "EMAIL_TAKEN" in msg:
        raise HTTPException(409, msg)
    if "CANNOT_DELETE_SELF" in msg or "CANNOT_DELETE_ADMIN" in msg:
        raise HTTPException(409, msg)
    raise HTTPException(400, msg)


@router.get("", response_model=list[Hospital])
async def list_endpoint(current: CurrentHospital = Depends(_admin)):
    return list_main()


@router.post("", response_model=Hospital)
async def create_endpoint(body: HospitalCreate, current: CurrentHospital = Depends(_admin)):
    try:
        return create_main(body.name, body.email, body.password)
    except ValueError as e:
        _handle(e)


@router.patch("/{hospital_id}", response_model=Hospital)
async def update_endpoint(
    hospital_id: str,
    body: HospitalUpdate,
    current: CurrentHospital = Depends(_admin),
):
    try:
        return update_main(hospital_id, body.name, body.password, body.is_active)
    except ValueError as e:
        _handle(e)


@router.delete("/{hospital_id}", status_code=204)
async def delete_endpoint(hospital_id: str, current: CurrentHospital = Depends(_admin)):
    try:
        delete_main(hospital_id, current_id=current["id"])
    except ValueError as e:
        _handle(e)

"""
TCQ POS — DJ API Routes
Manages DJ event registrations, QR generation, and drink redemption.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models.dj import DJRegistration, DJDrinkRedemption
from app.utils.security import get_current_user

router = APIRouter(prefix="/dj", tags=["DJ Events"])


class DJRegisterRequest(BaseModel):
    dj_name: str
    event_name: str
    event_date: str  # "2026-04-28"
    drinks_total: int = 3

class RedeemDrinkRequest(BaseModel):
    drink_type: str  # trago, sin_alcohol, gaseosa
    served_by: Optional[str] = None


@router.post("/register")
async def register_dj(data: DJRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a DJ for an event with drink allocation."""
    qr_code = f"DJ-{uuid.uuid4().hex[:8].upper()}"
    
    registration = DJRegistration(
        dj_name=data.dj_name.strip(),
        event_name=data.event_name.strip(),
        event_date=data.event_date,
        drinks_total=data.drinks_total,
        qr_code=qr_code,
    )
    db.add(registration)
    await db.flush()
    
    return {
        "id": str(registration.id),
        "dj_name": registration.dj_name,
        "event_name": registration.event_name,
        "event_date": registration.event_date,
        "drinks_total": registration.drinks_total,
        "drinks_remaining": registration.drinks_remaining,
        "qr_code": registration.qr_code,
        "message": f"✅ {registration.dj_name} registrado para {registration.event_name}",
    }


@router.get("/scan/{qr_code}")
async def scan_dj_qr(qr_code: str, db: AsyncSession = Depends(get_db)):
    """Barman scans a DJ QR code to see their drink status."""
    result = await db.execute(
        select(DJRegistration).where(DJRegistration.qr_code == qr_code, DJRegistration.is_active == True)
    )
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=404, detail="Código QR de DJ no encontrado o inactivo")
    
    redemptions = []
    for r in reg.redemptions:
        redemptions.append({
            "drink_type": r.drink_type,
            "served_by": r.served_by,
            "redeemed_at": r.redeemed_at.isoformat() if r.redeemed_at else None,
        })
    
    return {
        "id": str(reg.id),
        "dj_name": reg.dj_name,
        "event_name": reg.event_name,
        "event_date": reg.event_date,
        "drinks_total": reg.drinks_total,
        "drinks_used": reg.drinks_used,
        "drinks_remaining": reg.drinks_remaining,
        "qr_code": reg.qr_code,
        "redemptions": redemptions,
    }


@router.post("/redeem/{qr_code}")
async def redeem_drink(
    qr_code: str,
    data: RedeemDrinkRequest,
    db: AsyncSession = Depends(get_db),
):
    """Barman redeems a drink for a DJ by scanning their QR."""
    result = await db.execute(
        select(DJRegistration).where(DJRegistration.qr_code == qr_code, DJRegistration.is_active == True)
    )
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=404, detail="DJ no encontrado")
    
    if reg.drinks_remaining <= 0:
        raise HTTPException(status_code=400, detail=f"❌ {reg.dj_name} ya usó sus {reg.drinks_total} consumiciones")
    
    valid_types = ["trago", "sin_alcohol", "gaseosa"]
    if data.drink_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Tipo inválido. Opciones: {', '.join(valid_types)}")
    
    # Record redemption
    redemption = DJDrinkRedemption(
        registration_id=reg.id,
        drink_type=data.drink_type,
        served_by=data.served_by,
    )
    db.add(redemption)
    reg.drinks_used += 1
    
    type_labels = {"trago": "🍸 Trago", "sin_alcohol": "🥤 Sin Alcohol", "gaseosa": "🥫 Gaseosa"}
    
    return {
        "message": f"✅ {type_labels.get(data.drink_type, data.drink_type)} entregado a {reg.dj_name}",
        "dj_name": reg.dj_name,
        "drinks_used": reg.drinks_used,
        "drinks_remaining": reg.drinks_remaining,
        "drink_type": data.drink_type,
    }


@router.get("/registrations")
async def list_registrations(
    event_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all DJ registrations, optionally filtered by event date."""
    query = select(DJRegistration).where(DJRegistration.is_active == True)
    if event_date:
        query = query.where(DJRegistration.event_date == event_date)
    query = query.order_by(DJRegistration.created_at.desc())
    
    result = await db.execute(query)
    regs = []
    for reg in result.scalars().all():
        regs.append({
            "id": str(reg.id),
            "dj_name": reg.dj_name,
            "event_name": reg.event_name,
            "event_date": reg.event_date,
            "drinks_total": reg.drinks_total,
            "drinks_used": reg.drinks_used,
            "drinks_remaining": reg.drinks_remaining,
            "qr_code": reg.qr_code,
        })
    return regs


@router.delete("/{registration_id}")
async def deactivate_registration(registration_id: str, db: AsyncSession = Depends(get_db)):
    """Deactivate a DJ registration."""
    result = await db.execute(
        select(DJRegistration).where(DJRegistration.id == uuid.UUID(registration_id))
    )
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    reg.is_active = False
    return {"message": f"Registro de {reg.dj_name} desactivado"}

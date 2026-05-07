from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
import os
import uuid
import cloudinary
import cloudinary.uploader
from app.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.database import get_db
from app.models.event import Event
from app.models.ticket_type import TicketType
from app.models.ticket import Ticket
from app.schemas.event import EventCreate, EventResponse, TicketTypeCreate, TicketTypeResponse, TicketStats

router = APIRouter(tags=["Events"])

@router.post("/events", response_model=EventResponse)
async def create_event(event_in: EventCreate, db: AsyncSession = Depends(get_db)):
    # In a real scenario, protect this route for Admin only
    new_event = Event(**event_in.model_dump())
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    return new_event

@router.get("/events", response_model=List[EventResponse])
async def list_events(public_only: bool = False, db: AsyncSession = Depends(get_db)):
    query = select(Event).options(selectinload(Event.ticket_types)).filter(Event.is_active == True)
    if public_only:
        query = query.filter(Event.is_public == True)
    
    result = await db.execute(query)
    events = result.scalars().all()
    return events

@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(Event).options(selectinload(Event.ticket_types)).filter(Event.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post("/events/{event_id}/ticket-types", response_model=TicketTypeResponse)
async def create_ticket_type(event_id: UUID, ticket_in: TicketTypeCreate, db: AsyncSession = Depends(get_db)):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    new_tt = TicketType(**ticket_in.model_dump(), event_id=event_id)
    db.add(new_tt)
    await db.commit()
    await db.refresh(new_tt)
    return new_tt

@router.put("/events/ticket-types/{tt_id}", response_model=TicketTypeResponse)
async def update_ticket_type(tt_id: UUID, ticket_in: TicketTypeCreate, db: AsyncSession = Depends(get_db)):
    tt = await db.get(TicketType, tt_id)
    if not tt:
        raise HTTPException(status_code=404, detail="Ticket type not found")
    
    # Update fields
    for key, value in ticket_in.model_dump().items():
        setattr(tt, key, value)
    
    await db.commit()
    await db.refresh(tt)
    return tt

@router.get("/events/{event_id}/attendees", response_model=List[TicketResponse])
async def get_event_attendees(event_id: UUID, db: AsyncSession = Depends(get_db)):
    query = (
        select(Ticket)
        .options(selectinload(Ticket.ticket_type))
        .filter(Ticket.event_id == event_id)
        .order_by(Ticket.created_at.desc())
    )
    result = await db.execute(query)
    tickets = result.scalars().all()
    
    # Map to TicketResponse manually to ensure relations are flat if needed
    # (Though TicketResponse schema should handle it if Config.from_attributes is True)
    return tickets

@router.get("/events/{event_id}/stats", response_model=List[TicketStats])
async def get_event_stats(event_id: UUID, db: AsyncSession = Depends(get_db)):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    query = select(TicketType).filter(TicketType.event_id == event_id)
    result = await db.execute(query)
    ticket_types = result.scalars().all()
    
    stats = []
    for tt in ticket_types:
        # Count sold tickets (status == 'valid' or 'used')
        count_query = select(func.count(Ticket.id)).filter(
            Ticket.ticket_type_id == tt.id,
            Ticket.status.in_(["valid", "used", "transferred"])
        )
        count_result = await db.execute(count_query)
        sold_count = count_result.scalar() or 0

        # Count validated tickets (status == 'used')
        val_query = select(func.count(Ticket.id)).filter(
            Ticket.ticket_type_id == tt.id,
            Ticket.status == "used"
        )
        val_result = await db.execute(val_query)
        validated_count = val_result.scalar() or 0
        
        stats.append(TicketStats(
            ticket_type_id=tt.id,
            name=tt.name,
            price=float(tt.price),
            state=tt.state,
            sold=sold_count,
            validated=validated_count,
            stock=tt.stock
        ))
        
    return stats

@router.delete("/events/{event_id}")
async def delete_event(event_id: UUID, db: AsyncSession = Depends(get_db)):
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Soft delete
    event.is_active = False
    await db.commit()
    return {"success": True, "message": "Evento eliminado correctamente"}

@router.post("/events/upload-flyer")
async def upload_flyer(file: UploadFile = File(...)):
    settings = get_settings()
    
    # Configure Cloudinary
    if not settings.CLOUDINARY_URL:
        # Fallback to local if not configured (not recommended for production)
        UPLOAD_DIR = "uploads"
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        with open(file_path, "wb") as buffer:
            import shutil
            shutil.copyfileobj(file.file, buffer)
        url = f"https://tcq-project.onrender.com/uploads/{file_name}"
        return {"url": url}

    try:
        # Upload to Cloudinary
        # We can use the CLOUDINARY_URL from settings directly if we want, 
        # but cloudinary.config also works with the individual parts or the URL.
        cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)
        
        upload_result = cloudinary.uploader.upload(
            file.file,
            folder="tcq-events",
            resource_type="auto"
        )
        
        return {"url": upload_result.get("secure_url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen a Cloudinary: {str(e)}")


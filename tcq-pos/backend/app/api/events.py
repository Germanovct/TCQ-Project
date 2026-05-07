from fastapi import APIRouter, Depends, HTTPException, status
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
        
        stats.append(TicketStats(
            ticket_type_id=tt.id,
            name=tt.name,
            price=float(tt.price),
            state=tt.state,
            sold=sold_count,
            stock=tt.stock
        ))
        
    return stats

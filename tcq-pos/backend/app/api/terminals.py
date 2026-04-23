"""
TCQ POS — Terminals API Routes
Terminal (register/caja) lifecycle management.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from decimal import Decimal
from app.database import get_db
from app.models.terminal import Terminal
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

router = APIRouter(prefix="/terminals", tags=["Terminals"])


class TerminalCreate(BaseModel):
    name: str
    location: Optional[str] = None

class OpenTerminalRequest(BaseModel):
    initial_balance: float = 0.0
    operator_id: Optional[UUID] = None


@router.get("/")
async def list_terminals(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Terminal).order_by(Terminal.id))
    return [{"id": t.id, "name": t.name, "location": t.location, "is_open": t.is_open, "daily_total": float(t.daily_total or 0)} for t in result.scalars().all()]


@router.post("/", status_code=201)
async def create_terminal(data: TerminalCreate, db: AsyncSession = Depends(get_db)):
    terminal = Terminal(name=data.name, location=data.location)
    db.add(terminal)
    await db.flush()
    return {"id": terminal.id, "name": terminal.name, "message": "Terminal created"}


@router.post("/{terminal_id}/open")
async def open_terminal(terminal_id: int, data: OpenTerminalRequest, db: AsyncSession = Depends(get_db)):
    terminal = await db.get(Terminal, terminal_id)
    if not terminal:
        raise HTTPException(status_code=404, detail="Terminal not found")
    if terminal.is_open:
        raise HTTPException(status_code=400, detail="Terminal is already open")
    terminal.is_open = True
    terminal.initial_balance = Decimal(str(data.initial_balance))
    terminal.daily_total = Decimal("0.00")
    terminal.operator_id = data.operator_id
    terminal.opened_at = datetime.now(timezone.utc)
    terminal.closed_at = None
    return {"message": f"Terminal '{terminal.name}' opened", "initial_balance": data.initial_balance}


@router.post("/{terminal_id}/close")
async def close_terminal(terminal_id: int, db: AsyncSession = Depends(get_db)):
    terminal = await db.get(Terminal, terminal_id)
    if not terminal:
        raise HTTPException(status_code=404, detail="Terminal not found")
    if not terminal.is_open:
        raise HTTPException(status_code=400, detail="Terminal is already closed")
    terminal.is_open = False
    terminal.closed_at = datetime.now(timezone.utc)
    total_final = Decimal(str(terminal.initial_balance or 0)) + Decimal(str(terminal.daily_total or 0))
    return {"message": f"Terminal '{terminal.name}' closed", "initial_balance": float(terminal.initial_balance or 0), "daily_total": float(terminal.daily_total or 0), "total_final": float(total_final)}

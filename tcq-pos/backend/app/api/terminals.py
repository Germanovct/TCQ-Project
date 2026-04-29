"""
TCQ POS — Terminals API Routes
Terminal (register/caja) lifecycle management with shift tracking.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from app.database import get_db
from app.models.terminal import Terminal
from app.models.shift import CashRegisterShift
from app.models.transaction import Transaction
from app.models.user import User
from app.utils.security import get_current_user
from app.config import get_settings
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from sqlalchemy import func

settings = get_settings()
router = APIRouter(prefix="/terminals", tags=["Terminals"])


class TerminalCreate(BaseModel):
    name: str
    location: Optional[str] = None

class OpenTerminalRequest(BaseModel):
    initial_balance: float = 0.0
    operator_id: Optional[UUID] = None
    shift_label: str = "General"  # Mañana / Tarde / Noche / General

class VerifyPinRequest(BaseModel):
    pin: str
    terminal_id: Optional[int] = None
    item_name: Optional[str] = None
    item_price: Optional[float] = None
    operator_id: Optional[UUID] = None


@router.get("/")
async def list_terminals(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Terminal).order_by(Terminal.id))
    terminals = []
    for t in result.scalars().all():
        term_data = {
            "id": t.id,
            "name": t.name,
            "location": t.location,
            "is_open": t.is_open,
            "daily_total": float(t.daily_total or 0),
            "active_shift_id": t.active_shift_id,
            "opened_at": t.opened_at.isoformat() if t.opened_at else None,
            "operator_name": None,
        }
        # Get operator name if open
        if t.is_open and t.operator_id:
            op = await db.get(User, t.operator_id)
            if op:
                term_data["operator_name"] = op.full_name
        terminals.append(term_data)
    return terminals


@router.post("/", status_code=201)
async def create_terminal(data: TerminalCreate, db: AsyncSession = Depends(get_db)):
    terminal = Terminal(name=data.name, location=data.location)
    db.add(terminal)
    await db.flush()
    return {"id": terminal.id, "name": terminal.name, "message": "Terminal created"}


@router.post("/{terminal_id}/open")
async def open_terminal(
    terminal_id: int,
    data: OpenTerminalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    terminal = await db.get(Terminal, terminal_id)
    if not terminal:
        raise HTTPException(status_code=404, detail="Terminal not found")

    # Check for stale shifts (opened on a previous day)
    if terminal.is_open and terminal.opened_at:
        now = datetime.now(timezone.utc)
        opened_date = terminal.opened_at.date() if terminal.opened_at.tzinfo else terminal.opened_at.date()
        if opened_date < now.date():
            # Auto-close the stale shift and return warning
            return {
                "error": "STALE_SHIFT",
                "message": f"La caja quedó abierta del día {opened_date.strftime('%d/%m/%Y')}. Debe cerrarla primero.",
                "stale_date": opened_date.strftime("%d/%m/%Y"),
                "must_close_first": True,
            }

    if terminal.is_open:
        raise HTTPException(status_code=400, detail="Terminal is already open")

    # Create a new shift record
    shift = CashRegisterShift(
        terminal_id=terminal_id,
        operator_id=current_user.id,
        shift_label=data.shift_label,
        initial_balance=Decimal(str(data.initial_balance)),
        opened_at=datetime.now(timezone.utc),
    )
    db.add(shift)
    await db.flush()

    # Update terminal state
    terminal.is_open = True
    terminal.initial_balance = Decimal(str(data.initial_balance))
    terminal.daily_total = Decimal("0.00")
    terminal.operator_id = current_user.id
    terminal.opened_at = datetime.now(timezone.utc)
    terminal.closed_at = None
    terminal.active_shift_id = shift.id

    return {
        "message": f"Terminal '{terminal.name}' opened",
        "initial_balance": data.initial_balance,
        "shift_id": shift.id,
        "shift_label": data.shift_label,
        "opened_at": datetime.now(timezone.utc).isoformat(),
        "operator": current_user.full_name,
    }


@router.post("/{terminal_id}/close")
async def close_terminal(
    terminal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    terminal = await db.get(Terminal, terminal_id)
    if not terminal:
        raise HTTPException(status_code=404, detail="Terminal not found")
    if not terminal.is_open:
        raise HTTPException(status_code=400, detail="Terminal is already closed")

    now = datetime.now(timezone.utc)

    # Close the active shift
    if terminal.active_shift_id:
        shift = await db.get(CashRegisterShift, terminal.active_shift_id)
        if shift and shift.is_active:
            # Calculate totals by payment method for this shift
            cash_result = await db.execute(
                select(func.coalesce(func.sum(Transaction.total_amount), 0))
                .where(
                    Transaction.shift_id == shift.id,
                    Transaction.method == "CASH",
                    Transaction.status == "COMPLETED",
                )
            )
            tcq_result = await db.execute(
                select(func.coalesce(func.sum(Transaction.total_amount), 0))
                .where(
                    Transaction.shift_id == shift.id,
                    Transaction.method == "TCQ_BALANCE",
                    Transaction.status == "COMPLETED",
                )
            )
            mp_result = await db.execute(
                select(func.coalesce(func.sum(Transaction.total_amount), 0))
                .where(
                    Transaction.shift_id == shift.id,
                    Transaction.method == "MERCADO_PAGO",
                    Transaction.status == "COMPLETED",
                )
            )
            count_result = await db.execute(
                select(func.count(Transaction.id))
                .where(
                    Transaction.shift_id == shift.id,
                    Transaction.status == "COMPLETED",
                )
            )

            shift.total_cash = Decimal(str(cash_result.scalar() or 0))
            shift.total_tcq_balance = Decimal(str(tcq_result.scalar() or 0))
            shift.total_mercado_pago = Decimal(str(mp_result.scalar() or 0))
            shift.grand_total = shift.total_cash + shift.total_tcq_balance + shift.total_mercado_pago
            shift.transaction_count = count_result.scalar() or 0
            shift.is_active = False
            shift.closed_at = now

    # Close terminal
    terminal.is_open = False
    terminal.closed_at = now
    total_final = Decimal(str(terminal.initial_balance or 0)) + Decimal(str(terminal.daily_total or 0))

    return {
        "message": f"Terminal '{terminal.name}' closed",
        "initial_balance": float(terminal.initial_balance or 0),
        "daily_total": float(terminal.daily_total or 0),
        "total_final": float(total_final),
        "closed_at": now.isoformat(),
        "closed_by": current_user.full_name,
        "voided_items": shift.voided_items if 'shift' in locals() and shift else []
    }


@router.post("/{terminal_id}/force-close")
async def force_close_stale_terminal(
    terminal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Force-close a stale terminal from a previous day."""
    terminal = await db.get(Terminal, terminal_id)
    if not terminal:
        raise HTTPException(status_code=404, detail="Terminal not found")

    now = datetime.now(timezone.utc)

    # Close any active shift
    if terminal.active_shift_id:
        shift = await db.get(CashRegisterShift, terminal.active_shift_id)
        if shift and shift.is_active:
            shift.is_active = False
            shift.closed_at = now
            # Calculate totals
            total_result = await db.execute(
                select(func.coalesce(func.sum(Transaction.total_amount), 0))
                .where(
                    Transaction.shift_id == shift.id,
                    Transaction.status == "COMPLETED",
                )
            )
            shift.grand_total = Decimal(str(total_result.scalar() or 0))

    terminal.is_open = False
    terminal.closed_at = now
    terminal.active_shift_id = None

    return {"message": f"Terminal '{terminal.name}' force-closed", "closed_at": now.isoformat()}


@router.get("/{terminal_id}/shifts")
async def get_terminal_shifts(
    terminal_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get shift history for a terminal."""
    result = await db.execute(
        select(CashRegisterShift)
        .where(CashRegisterShift.terminal_id == terminal_id)
        .order_by(CashRegisterShift.opened_at.desc())
        .limit(50)
    )
    shifts = []
    for s in result.scalars().all():
        op_name = None
        if s.operator_id:
            op = await db.get(User, s.operator_id)
            if op:
                op_name = op.full_name
        shifts.append({
            "id": s.id,
            "shift_label": s.shift_label,
            "operator_name": op_name,
            "initial_balance": float(s.initial_balance or 0),
            "total_cash": float(s.total_cash or 0),
            "total_tcq_balance": float(s.total_tcq_balance or 0),
            "total_mercado_pago": float(s.total_mercado_pago or 0),
            "grand_total": float(s.grand_total or 0),
            "transaction_count": s.transaction_count or 0,
            "is_active": s.is_active,
            "opened_at": s.opened_at.isoformat() if s.opened_at else None,
            "closed_at": s.closed_at.isoformat() if s.closed_at else None,
        })
    return shifts


@router.get("/all-live")
async def get_all_live_registers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin: Get live status of all registers with current shift totals."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    result = await db.execute(select(Terminal).order_by(Terminal.id))
    registers = []
    for t in result.scalars().all():
        # Calculate live total from actual completed transactions for the active shift
        live_total = float(t.daily_total or 0)
        txn_count = 0
        if t.is_open and t.active_shift_id:
            total_result = await db.execute(
                select(
                    func.coalesce(func.sum(Transaction.total_amount), 0),
                    func.count(Transaction.id),
                ).where(
                    Transaction.shift_id == t.active_shift_id,
                    Transaction.status == "COMPLETED",
                )
            )
            row = total_result.one()
            live_total = float(row[0])
            txn_count = int(row[1])

        reg = {
            "id": t.id,
            "name": t.name,
            "location": t.location,
            "is_open": t.is_open,
            "daily_total": live_total,
            "transaction_count": txn_count,
            "initial_balance": float(t.initial_balance or 0),
            "opened_at": t.opened_at.isoformat() if t.opened_at else None,
            "operator_name": None,
            "shift_label": None,
        }
        if t.operator_id:
            op = await db.get(User, t.operator_id)
            if op:
                reg["operator_name"] = op.full_name
        if t.active_shift_id:
            shift = await db.get(CashRegisterShift, t.active_shift_id)
            if shift:
                reg["shift_label"] = shift.shift_label
        registers.append(reg)

    # Grand total across all open registers
    total = sum(r["daily_total"] for r in registers if r["is_open"])

    return {"registers": registers, "grand_total": total}


@router.post("/verify-pin")
async def verify_pin(data: VerifyPinRequest, db: AsyncSession = Depends(get_db)):
    """Verify admin PIN for protected operations (like removing items from cart) and log voided items."""
    if data.pin != settings.ADMIN_PIN:
        raise HTTPException(status_code=403, detail="PIN incorrecto")
        
    if data.terminal_id and data.item_name:
        # Find active shift for this terminal and log the voided item
        terminal = await db.get(Terminal, data.terminal_id)
        if terminal and terminal.active_shift_id:
            shift = await db.get(CashRegisterShift, terminal.active_shift_id)
            if shift:
                # SQLite JSON lists might need reassignment to trigger SQLAlchemy updates
                current_voids = list(shift.voided_items or [])
                current_voids.append({
                    "name": data.item_name,
                    "price": data.item_price or 0,
                    "operator_id": str(data.operator_id) if data.operator_id else None,
                    "time": datetime.now(timezone.utc).isoformat()
                })
                shift.voided_items = current_voids
                await db.commit()

    return {"valid": True}

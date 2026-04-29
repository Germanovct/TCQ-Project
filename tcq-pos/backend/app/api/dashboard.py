"""
TCQ POS — Dashboard API
Real-time event broadcasting and reporting endpoints.
"""
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta
from app.database import get_db, async_session
from app.models.transaction import Transaction, TransactionItem
from app.models.product import Product
from app.models.user import User
from app.models.terminal import Terminal
from app.models.shift import CashRegisterShift
from app.utils.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# Connected WebSocket clients
connected_clients: list[WebSocket] = []


async def broadcast_event(event: dict):
    """Broadcast an event to all connected dashboard clients."""
    message = json.dumps(event, default=str)
    disconnected = []
    for client in connected_clients:
        try:
            await client.send_text(message)
        except Exception:
            disconnected.append(client)
    for client in disconnected:
        if client in connected_clients:
            connected_clients.remove(client)


@router.websocket("/ws")
async def dashboard_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time dashboard updates."""
    await websocket.accept()
    connected_clients.append(websocket)
    logger.info(f"📡 Dashboard client connected. Total: {len(connected_clients)}")

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"event": "pong"}))
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
        logger.info(f"📡 Dashboard client disconnected. Total: {len(connected_clients)}")
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)


@router.get("/summary")
async def get_daily_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's sales summary for the dashboard."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # Base filters
    filters = [Transaction.status == "COMPLETED", Transaction.created_at >= today_start]
    
    # If barman, only show their own sales
    if current_user.role == "barman":
        filters.append(Transaction.operator_id == current_user.id)

    # Total revenue and count
    result = await db.execute(
        select(
            func.count(Transaction.id).label("count"),
            func.coalesce(func.sum(Transaction.total_amount), 0).label("total"),
        ).where(*filters)
    )
    row = result.one()

    # Revenue by method
    method_result = await db.execute(
        select(Transaction.method, func.sum(Transaction.total_amount))
        .where(*filters)
        .group_by(Transaction.method)
    )
    revenue_by_method = {m: float(t) for m, t in method_result.all()}

    # Top products
    top_result = await db.execute(
        select(Product.name, func.sum(TransactionItem.quantity).label("qty"), func.sum(TransactionItem.subtotal).label("rev"))
        .join(TransactionItem, TransactionItem.product_id == Product.id)
        .join(Transaction, Transaction.id == TransactionItem.transaction_id)
        .where(*filters)
        .group_by(Product.name)
        .order_by(func.sum(TransactionItem.quantity).desc())
        .limit(10)
    )
    top_products = [{"name": n, "quantity": int(q), "revenue": float(r)} for n, q, r in top_result.all()]

    # Per-register breakdown (admin only)
    register_breakdown = []
    if current_user.role == "admin":
        reg_result = await db.execute(
            select(
                Terminal.name,
                Terminal.id,
                func.count(Transaction.id).label("count"),
                func.coalesce(func.sum(Transaction.total_amount), 0).label("total"),
            )
            .join(Transaction, Transaction.terminal_id == Terminal.id)
            .where(*filters)
            .group_by(Terminal.id, Terminal.name)
            .order_by(Terminal.id)
        )
        register_breakdown = [
            {"terminal_name": name, "terminal_id": tid, "transaction_count": int(cnt), "total": float(tot)}
            for name, tid, cnt, tot in reg_result.all()
        ]

    return {
        "date": today_start.strftime("%Y-%m-%d"),
        "total_revenue": float(row.total),
        "transaction_count": row.count,
        "top_products": top_products,
        "revenue_by_method": revenue_by_method,
        "register_breakdown": register_breakdown,
    }


@router.get("/shift-report/{shift_id}")
async def get_shift_report(
    shift_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed report for a specific shift."""
    shift = await db.get(CashRegisterShift, shift_id)
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    # Get transactions for this shift
    txn_result = await db.execute(
        select(Transaction)
        .where(Transaction.shift_id == shift_id, Transaction.status == "COMPLETED")
        .order_by(Transaction.created_at.desc())
    )
    transactions = []
    for txn in txn_result.scalars().all():
        transactions.append({
            "id": str(txn.id),
            "method": txn.method,
            "total_amount": float(txn.total_amount),
            "table_ref": txn.table_ref,
            "items_snapshot": txn.items_snapshot,
            "created_at": txn.created_at.isoformat() if txn.created_at else None,
        })

    # Top products for this shift
    top_result = await db.execute(
        select(Product.name, func.sum(TransactionItem.quantity).label("qty"), func.sum(TransactionItem.subtotal).label("rev"))
        .join(TransactionItem, TransactionItem.product_id == Product.id)
        .join(Transaction, Transaction.id == TransactionItem.transaction_id)
        .where(Transaction.shift_id == shift_id, Transaction.status == "COMPLETED")
        .group_by(Product.name)
        .order_by(func.sum(TransactionItem.quantity).desc())
        .limit(10)
    )
    top_products = [{"name": n, "quantity": int(q), "revenue": float(r)} for n, q, r in top_result.all()]

    # Operator name
    op_name = None
    if shift.operator_id:
        op = await db.get(User, shift.operator_id)
        if op:
            op_name = op.full_name

    # Terminal name
    terminal = await db.get(Terminal, shift.terminal_id)

    return {
        "shift_id": shift.id,
        "terminal_name": terminal.name if terminal else "Unknown",
        "operator_name": op_name,
        "shift_label": shift.shift_label,
        "initial_balance": float(shift.initial_balance or 0),
        "total_cash": float(shift.total_cash or 0),
        "total_tcq_balance": float(shift.total_tcq_balance or 0),
        "total_mercado_pago": float(shift.total_mercado_pago or 0),
        "grand_total": float(shift.grand_total or 0),
        "transaction_count": shift.transaction_count or 0,
        "is_active": shift.is_active,
        "opened_at": shift.opened_at.isoformat() if shift.opened_at else None,
        "closed_at": shift.closed_at.isoformat() if shift.closed_at else None,
        "transactions": transactions,
        "top_products": top_products,
    }


# Import HTTPException for shift-report
from fastapi import HTTPException

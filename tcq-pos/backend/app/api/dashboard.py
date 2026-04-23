"""
TCQ POS — WebSocket Dashboard
Real-time event broadcasting for the admin dashboard.
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
        connected_clients.remove(websocket)
        logger.info(f"📡 Dashboard client disconnected. Total: {len(connected_clients)}")


@router.get("/summary")
async def get_daily_summary(db: AsyncSession = Depends(get_db)):
    """Get today's sales summary for the dashboard."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # Total revenue and count
    result = await db.execute(
        select(
            func.count(Transaction.id).label("count"),
            func.coalesce(func.sum(Transaction.total_amount), 0).label("total"),
        ).where(Transaction.status == "COMPLETED", Transaction.created_at >= today_start)
    )
    row = result.one()

    # Revenue by method
    method_result = await db.execute(
        select(Transaction.method, func.sum(Transaction.total_amount))
        .where(Transaction.status == "COMPLETED", Transaction.created_at >= today_start)
        .group_by(Transaction.method)
    )
    revenue_by_method = {m: float(t) for m, t in method_result.all()}

    # Top products
    top_result = await db.execute(
        select(Product.name, func.sum(TransactionItem.quantity).label("qty"), func.sum(TransactionItem.subtotal).label("rev"))
        .join(TransactionItem, TransactionItem.product_id == Product.id)
        .join(Transaction, Transaction.id == TransactionItem.transaction_id)
        .where(Transaction.status == "COMPLETED", Transaction.created_at >= today_start)
        .group_by(Product.name)
        .order_by(func.sum(TransactionItem.quantity).desc())
        .limit(10)
    )
    top_products = [{"name": n, "quantity": int(q), "revenue": float(r)} for n, q, r in top_result.all()]

    return {
        "date": today_start.strftime("%Y-%m-%d"),
        "total_revenue": float(row.total),
        "transaction_count": row.count,
        "top_products": top_products,
        "revenue_by_method": revenue_by_method,
    }

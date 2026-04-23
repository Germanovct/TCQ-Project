"""
TCQ POS — Mercado Pago Webhook Handler
Receives payment notifications from MP and completes pending transactions.
"""
import logging
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import select
from datetime import datetime, timezone
from decimal import Decimal
from app.database import async_session
from app.models.transaction import Transaction
from app.models.terminal import Terminal
from app.services.mercadopago_service import mp_service
from app.api.dashboard import broadcast_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/mercadopago")
async def mercadopago_webhook(request: Request):
    """
    Receives payment notifications from Mercado Pago.
    When payment is approved, completes the pending transaction
    and broadcasts to the WebSocket dashboard.
    """
    body = await request.json()
    logger.info(f"📬 MP Webhook received: {body}")

    if body.get("type") != "payment":
        return {"status": "ignored", "reason": "not a payment notification"}

    payment_id = str(body.get("data", {}).get("id", ""))
    if not payment_id:
        return {"status": "ignored", "reason": "no payment id"}

    # Verify with MP API
    verification = await mp_service.verify_payment(payment_id)
    if not verification.get("success"):
        logger.error(f"❌ MP verification failed: {verification}")
        return {"status": "error"}

    if verification["status"] != "approved":
        logger.info(f"MP payment {payment_id} status: {verification['status']}")
        return {"status": "noted", "payment_status": verification["status"]}

    # Find and complete the transaction
    ext_ref = verification.get("external_reference")
    if not ext_ref:
        return {"status": "error", "reason": "no external reference"}

    async with async_session() as db:
        try:
            result = await db.execute(select(Transaction).where(Transaction.id == ext_ref))
            txn = result.scalar_one_or_none()

            if not txn:
                logger.error(f"❌ Transaction not found: {ext_ref}")
                return {"status": "error", "reason": "transaction not found"}

            if txn.status == "COMPLETED":
                return {"status": "already_completed"}

            txn.status = "COMPLETED"
            txn.mp_payment_id = payment_id
            txn.completed_at = datetime.now(timezone.utc)

            # Update terminal daily total
            terminal = await db.get(Terminal, txn.terminal_id)
            if terminal:
                terminal.daily_total = Decimal(str(terminal.daily_total or 0)) + Decimal(str(txn.total_amount))

            await db.commit()

            # Broadcast to dashboard
            await broadcast_event({
                "event": "sale_completed",
                "transaction_id": str(txn.id),
                "terminal_id": txn.terminal_id,
                "total_amount": float(txn.total_amount),
                "method": "MERCADO_PAGO",
                "message": f"✅ Pago MP confirmado: ${txn.total_amount}",
            })

            logger.info(f"✅ MP payment completed: txn={ext_ref} amount=${txn.total_amount}")
            return {"status": "completed"}

        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Webhook processing error: {e}")
            raise HTTPException(status_code=500, detail="Webhook processing error")

"""
TCQ POS — Orders API Routes
The main /create-order endpoint and order management.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.database import get_db
from app.schemas.order import CreateOrderRequest, CreateOrderResponse, TransactionResponse
from app.services.payment_service import PaymentService
from app.models.transaction import Transaction

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/create-order", response_model=dict)
async def create_order(order: CreateOrderRequest, db: AsyncSession = Depends(get_db)):
    """
    Create a new order with hybrid payment processing.
    
    Methods:
    - TCQ_BALANCE: Debits from user internal wallet (requires user_id)
    - MERCADO_PAGO: Generates dynamic QR for client payment
    - CASH: Direct cash sale
    """
    result = await PaymentService.process_order(db, order)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Payment failed"))
    return result


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_order(transaction_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get transaction details by ID."""
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.get("/terminal/{terminal_id}", response_model=list[TransactionResponse])
async def get_terminal_orders(terminal_id: int, db: AsyncSession = Depends(get_db)):
    """Get all transactions for a terminal (current shift)."""
    result = await db.execute(
        select(Transaction)
        .where(Transaction.terminal_id == terminal_id)
        .order_by(Transaction.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.post("/{transaction_id}/fiscal-ticket")
async def generate_fiscal_ticket(transaction_id: UUID, db: AsyncSession = Depends(get_db)):
    """Generate a fiscal ticket (Factura) via ARCA/AFIP for an existing transaction."""
    txn = await db.get(Transaction, transaction_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if txn.afip_cae:
        return {
            "cae": txn.afip_cae,
            "vto_cae": txn.afip_vto_cae,
            "nro_comprobante": txn.afip_voucher_num
        }

    from app.services.afip_service import afip_service
    res = await afip_service.generate_ticket(float(txn.total_amount), txn.method, str(txn.id))
    
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Error generando ticket AFIP"))

    txn.afip_cae = res["cae"]
    txn.afip_vto_cae = res["vto_cae"]
    txn.afip_voucher_num = res["nro_comprobante"]
    await db.commit()

    return {
        "cae": txn.afip_cae,
        "vto_cae": txn.afip_vto_cae,
        "nro_comprobante": txn.afip_voucher_num
    }

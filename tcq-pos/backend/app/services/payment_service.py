"""
TCQ POS — Payment Service (Orchestrator)
Central business logic for the hybrid payment flow.
Coordinates between WalletService, MercadoPagoService, and the DB.
"""
import logging
from decimal import Decimal
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.models.terminal import Terminal
from app.models.transaction import Transaction, TransactionItem
from app.services.wallet_service import WalletService, InsufficientBalanceError
from app.services.mercadopago_service import mp_service
from app.schemas.order import CreateOrderRequest, OrderItemDetail

logger = logging.getLogger(__name__)


class PaymentService:
    """
    Orchestrates the hybrid payment flow:
    - TCQ_BALANCE → atomic wallet debit
    - MERCADO_PAGO → QR generation + webhook confirmation
    - CASH → direct completion
    """

    @staticmethod
    async def process_order(
        db: AsyncSession,
        order: CreateOrderRequest,
    ) -> dict:
        # 1. Validate terminal is open
        terminal = await db.get(Terminal, order.terminal_id)
        if not terminal or not terminal.is_open:
            return {"success": False, "error": "Terminal is not open"}

        # 2. Resolve products and validate stock
        items_detail = []
        total = Decimal("0.00")

        for order_item in order.items:
            result = await db.execute(
                select(Product)
                .where(Product.id == order_item.product_id)
                .with_for_update()
            )
            product = result.scalar_one_or_none()

            if not product or not product.is_active:
                return {"success": False, "error": f"Product {order_item.product_id} not found"}
            if product.stock < order_item.quantity:
                return {"success": False, "error": f"Insufficient stock for '{product.name}': available={product.stock}, requested={order_item.quantity}"}

            subtotal = Decimal(str(product.price)) * order_item.quantity
            total += subtotal
            items_detail.append({
                "product_id": product.id,
                "product_name": product.name,
                "quantity": order_item.quantity,
                "unit_price": float(product.price),
                "subtotal": float(subtotal),
                "product_ref": product,
            })

        # 3. Create transaction record
        snapshot = [{"name": i["product_name"], "qty": i["quantity"], "price": i["unit_price"], "subtotal": i["subtotal"]} for i in items_detail]
        txn = Transaction(
            user_id=order.user_id,
            operator_id=order.operator_id,
            terminal_id=order.terminal_id,
            shift_id=terminal.active_shift_id,
            method=order.method,
            status="PENDING",
            total_amount=total,
            table_ref=order.table_ref,
            items_snapshot=snapshot,
        )
        db.add(txn)
        await db.flush()

        # Add line items
        for item in items_detail:
            db.add(TransactionItem(
                transaction_id=txn.id,
                product_id=item["product_id"],
                quantity=item["quantity"],
                unit_price=Decimal(str(item["unit_price"])),
                subtotal=Decimal(str(item["subtotal"])),
            ))

        # 4. Process by method
        if order.method == "TCQ_BALANCE":
            return await PaymentService._process_tcq_balance(db, txn, order, items_detail, total)
        elif order.method == "MERCADO_PAGO":
            return await PaymentService._process_mercado_pago(db, txn, items_detail, total, terminal)
        elif order.method == "CASH":
            return await PaymentService._process_cash(db, txn, items_detail, total, terminal)
        else:
            return {"success": False, "error": f"Unknown payment method: {order.method}"}

    @staticmethod
    async def _process_tcq_balance(db, txn, order, items_detail, total):
        if not order.user_id:
            return {"success": False, "error": "user_id required for TCQ_BALANCE"}
        try:
            new_balance = await WalletService.debit(db, order.user_id, total)
            await PaymentService._complete_sale(db, txn, items_detail)
            return {
                "success": True,
                "transaction_id": str(txn.id),
                "status": "COMPLETED",
                "method": "TCQ_BALANCE",
                "total_amount": float(total),
                "remaining_balance": float(new_balance),
                "items": [OrderItemDetail(**{k: v for k, v in i.items() if k != "product_ref"}) for i in items_detail],
                "message": f"✅ Pago con saldo TCQ exitoso. Saldo restante: ${new_balance}",
            }
        except InsufficientBalanceError as e:
            txn.status = "FAILED"
            return {"success": False, "error": f"Saldo insuficiente. Disponible: ${e.available}, requerido: ${e.required}"}

    @staticmethod
    async def _process_mercado_pago(db, txn, items_detail, total, terminal):
        mp_items = [{"name": i["product_name"], "quantity": i["quantity"], "unit_price": i["unit_price"]} for i in items_detail]
        mp_result = await mp_service.create_qr_preference(str(txn.id), mp_items, total, terminal.name)
        if not mp_result["success"]:
            txn.status = "FAILED"
            return {"success": False, "error": f"Error de Mercado Pago: {mp_result['error']}"}
        txn.mp_preference_id = mp_result["preference_id"]
        return {
            "success": True,
            "transaction_id": str(txn.id),
            "status": "PENDING",
            "method": "MERCADO_PAGO",
            "total_amount": float(total),
            "qr_data": mp_result["qr_data"],
            "mp_preference_id": mp_result["preference_id"],
            "items": [OrderItemDetail(**{k: v for k, v in i.items() if k != "product_ref"}) for i in items_detail],
            "message": "📱 QR generado. Esperando pago del cliente...",
        }

    @staticmethod
    async def _process_cash(db, txn, items_detail, total, terminal):
        await PaymentService._complete_sale(db, txn, items_detail)
        terminal.daily_total = Decimal(str(terminal.daily_total or 0)) + total
        return {
            "success": True,
            "transaction_id": str(txn.id),
            "status": "COMPLETED",
            "method": "CASH",
            "total_amount": float(total),
            "items": [OrderItemDetail(**{k: v for k, v in i.items() if k != "product_ref"}) for i in items_detail],
            "message": f"✅ Venta en efectivo registrada: ${total}",
        }

    @staticmethod
    async def _complete_sale(db, txn, items_detail):
        txn.status = "COMPLETED"
        txn.completed_at = datetime.now(timezone.utc)
        for item in items_detail:
            product = item["product_ref"]
            product.stock -= item["quantity"]

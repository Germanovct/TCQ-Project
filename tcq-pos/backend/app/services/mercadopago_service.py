"""
TCQ POS — Mercado Pago Service
Dynamic QR payment generation via MP SDK.
"""
import logging
from decimal import Decimal
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MercadoPagoService:
    def __init__(self):
        self._sdk = None
        if settings.MP_ACCESS_TOKEN:
            try:
                import mercadopago
                self._sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
                logger.info("✅ MP SDK initialized")
            except Exception as e:
                logger.error(f"❌ MP SDK init failed: {e}")

    async def create_qr_preference(self, transaction_id: str, items: list, total_amount: Decimal, terminal_name: str = "TCQ Bar") -> dict:
        if not self._sdk:
            return {"success": False, "error": "MP not configured", "qr_data": None, "preference_id": None}
        try:
            mp_items = [{"title": i["name"], "quantity": i["quantity"], "unit_price": float(i["unit_price"]), "currency_id": "ARS"} for i in items]
            pref = self._sdk.preference().create({
                "items": mp_items, 
                "external_reference": str(transaction_id), 
                "statement_descriptor": "TCQ Club", 
                "metadata": {"transaction_id": str(transaction_id)},
                "notification_url": "https://tcq-project.onrender.com/api/v1/webhooks/mercadopago"
            })
            resp = pref.get("response", {})
            return {"success": True, "preference_id": resp.get("id"), "qr_data": resp.get("init_point"), "sandbox_qr": resp.get("sandbox_init_point")}
        except Exception as e:
            logger.error(f"❌ MP preference failed: {e}")
            return {"success": False, "error": str(e), "qr_data": None, "preference_id": None}

    async def verify_payment(self, payment_id: str) -> dict:
        if not self._sdk:
            return {"success": False, "error": "MP not configured"}
        try:
            resp = self._sdk.payment().get(payment_id).get("response", {})
            return {"success": True, "status": resp.get("status"), "external_reference": resp.get("external_reference"), "amount": resp.get("transaction_amount"), "payment_id": str(resp.get("id"))}
        except Exception as e:
            return {"success": False, "error": str(e)}

mp_service = MercadoPagoService()

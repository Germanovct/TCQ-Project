import logging
import httpx
from decimal import Decimal
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class MercadoPagoService:
    def __init__(self):
        self.access_token = settings.MP_ACCESS_TOKEN
        # Extract user_id from token if it follows APP_USR format
        self.user_id = "792256837" # Hardcoded for now based on previous check, could be dynamic
        self.external_pos_id = "TCQPOS1"
        self.pos_qr_data = "00020101021143540016com.mercadolibre0130https://mpago.la/pos/13161323350150011203835115355204970053030325802AR5903TCQ6004CABA63042DCB"
        
        if self.access_token:
            logger.info("✅ MP Service initialized for In-Store QR")
        else:
            logger.error("❌ MP ACCESS TOKEN is missing!")

    async def create_qr_preference(self, transaction_id: str, items: list, total_amount: Decimal, terminal_name: str = "TCQ Bar") -> dict:
        if not self.access_token:
            return {"success": False, "error": "MP not configured", "qr_data": None, "preference_id": None}
            
        try:
            mp_items = [{
                "title": i["name"], 
                "quantity": i["quantity"], 
                "unit_price": float(i["unit_price"]), 
                "unit_measure": "unit",
                "total_amount": float(i["unit_price"]) * i["quantity"]
            } for i in items]
            
            payload = {
                "external_reference": str(transaction_id),
                "title": f"Pedido {terminal_name}",
                "description": "Consumo en TCQ Club",
                "notification_url": "https://tcq-project.onrender.com/api/v1/webhooks/mercadopago",
                "total_amount": float(total_amount),
                "items": mp_items,
                "cash_out": {"amount": 0}
            }
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            url = f"https://api.mercadopago.com/instore/orders/qr/seller/collectors/{self.user_id}/pos/{self.external_pos_id}/qrs"
            
            async with httpx.AsyncClient() as client:
                res = await client.put(url, json=payload, headers=headers)
                
            if res.status_code in (200, 201, 204):
                # Order successfully created in the POS
                return {
                    "success": True, 
                    "preference_id": str(transaction_id), # Using txn ID as reference
                    "qr_data": self.pos_qr_data, # Fixed QR string for this POS
                    "sandbox_qr": None
                }
            else:
                logger.error(f"❌ MP instore order failed: {res.status_code} - {res.text}")
                return {"success": False, "error": f"MP Error: {res.text}", "qr_data": None, "preference_id": None}
                
        except Exception as e:
            logger.error(f"❌ MP preference failed: {e}")
            return {"success": False, "error": str(e), "qr_data": None, "preference_id": None}

    async def verify_payment(self, payment_id: str) -> dict:
        if not self.access_token:
            return {"success": False, "error": "MP not configured"}
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            async with httpx.AsyncClient() as client:
                res = await client.get(f"https://api.mercadopago.com/v1/payments/{payment_id}", headers=headers)
                
            if res.status_code == 200:
                resp = res.json()
                return {
                    "success": True, 
                    "status": resp.get("status"), 
                    "external_reference": resp.get("external_reference"), 
                    "amount": resp.get("transaction_amount"), 
                    "payment_id": str(resp.get("id"))
                }
            else:
                return {"success": False, "error": f"Payment not found: {res.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def create_checkout_preference(self, purchase_id: str, items: list, payer_email: str) -> dict:
        """Create a preference for MercadoPago Checkout Pro (online purchases)."""
        if not self.access_token:
            return {"success": False, "error": "MP not configured"}
            
        try:
            mp_items = [{
                "title": i["title"],
                "quantity": i["quantity"],
                "unit_price": float(i["unit_price"]),
                "currency_id": "ARS"
            } for i in items]
            
            payload = {
                "items": mp_items,
                "payer": {"email": payer_email},
                "back_urls": {
                    "success": "https://tcqlub.com/tickets/success",
                    "failure": "https://tcqlub.com/tickets/failure",
                    "pending": "https://tcqlub.com/tickets/pending"
                },
                "auto_return": "approved",
                "external_reference": str(purchase_id),
                "notification_url": "https://tcq-project.onrender.com/api/v1/webhooks/mercadopago/ticket",
            }
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                res = await client.post("https://api.mercadopago.com/checkout/preferences", json=payload, headers=headers)
                
            if res.status_code in (200, 201):
                resp = res.json()
                return {
                    "success": True,
                    "preference_id": resp.get("id"),
                    "init_point": resp.get("init_point"),
                    "sandbox_init_point": resp.get("sandbox_init_point")
                }
            else:
                logger.error(f"❌ MP Checkout Pro failed: {res.status_code} - {res.text}")
                return {"success": False, "error": f"MP Error: {res.text}"}
                
        except Exception as e:
            logger.error(f"❌ MP preference failed: {e}")
            return {"success": False, "error": str(e)}

mp_service = MercadoPagoService()

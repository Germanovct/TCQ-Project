import asyncio
from app.config import get_settings
from afip import Afip

settings = get_settings()

with open(settings.AFIP_CERT_PATH, 'r') as f:
    cert_content = f.read()
with open(settings.AFIP_KEY_PATH, 'r') as f:
    key_content = f.read()

afip_local = Afip({
    "CUIT": settings.AFIP_CUIT,
    "cert": cert_content,
    "key": key_content,
    "production": True,
    "access_token": settings.AFIP_ACCESS_TOKEN
})

try:
    last_voucher = afip_local.ElectronicBilling.getLastVoucher(1, 6)
    print("Success! Last voucher:", last_voucher)
except Exception as e:
    print("Error:", e)

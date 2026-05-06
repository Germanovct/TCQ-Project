import asyncio
import httpx
from app.config import get_settings

settings = get_settings()

async def setup():
    headers = {"Authorization": f"Bearer {settings.MP_ACCESS_TOKEN}"}
    async with httpx.AsyncClient() as client:
        payload = {
            "name": "Caja TCQ",
            "fixed_amount": True,
            "store_id": "61912749",
            "external_id": "TCQPOS1",
            "category": 621102
        }
        res = await client.post("https://api.mercadopago.com/pos", json=payload, headers=headers)
        print("Create POS:", res.status_code, res.text)

if __name__ == "__main__":
    asyncio.run(setup())

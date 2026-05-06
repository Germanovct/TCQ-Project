import asyncio
import httpx
from app.config import get_settings

settings = get_settings()

async def check():
    headers = {"Authorization": f"Bearer {settings.MP_ACCESS_TOKEN}"}
    async with httpx.AsyncClient() as client:
        # Get user
        r_user = await client.get("https://api.mercadopago.com/users/me", headers=headers)
        user_data = r_user.json()
        user_id = user_data.get("id")
        print(f"User ID: {user_id}")
        
        # Get POS
        r_pos = await client.get(f"https://api.mercadopago.com/pos?collector.id={user_id}", headers=headers)
        print("POS:", r_pos.json())

        # Get Stores
        r_stores = await client.get(f"https://api.mercadopago.com/users/{user_id}/stores", headers=headers)
        print("Stores:", r_stores.json())

if __name__ == "__main__":
    asyncio.run(check())

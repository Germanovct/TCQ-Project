"""
TCQ POS — Database Seed Script
Populates the database with initial data migrated from the current localStorage system.
Run: python -m app.seed
"""
import asyncio
from decimal import Decimal
from app.database import async_session, init_db
from app.models.product import Product
from app.models.terminal import Terminal
from app.models.user import User
from app.utils.security import hash_password


# Products migrated from the current index.html defaultDb
SEED_PRODUCTS = [
    # Bebidas sin alcohol
    {"name": "Agua Mineral 500ml", "category": "bebidas", "price": 8000, "stock": 20},
    {"name": "Agua c/ Gas 500ml", "category": "bebidas", "price": 1500, "stock": 20},
    {"name": "Gaseosa Cola Fila", "category": "bebidas", "price": 2000, "stock": 15},
    {"name": "Gaseosa Lima", "category": "bebidas", "price": 2000, "stock": 15},
    {"name": "Jugo de Naranja", "category": "bebidas", "price": 2500, "stock": 10},
    {"name": "Red Bull", "category": "bebidas", "price": 3000, "stock": 10},
    {"name": "Speed", "category": "bebidas", "price": 3000, "stock": 10},
    # Tragos
    {"name": "Fernet con Cola", "category": "tragos", "price": 6000, "stock": 30},
    {"name": "Gin Tonic Clásico", "category": "tragos", "price": 6500, "stock": 20},
    {"name": "Gin Tonic Frutos Rojos", "category": "tragos", "price": 7000, "stock": 20},
    {"name": "Cuba Libre", "category": "tragos", "price": 5500, "stock": 20},
    {"name": "Mojito Cubano", "category": "tragos", "price": 6000, "stock": 15},
    {"name": "Campari Orange", "category": "tragos", "price": 5500, "stock": 15},
    # Promos
    {"name": "Promo 2x1 Fernet", "category": "promos", "price": 10000, "stock": 10},
    {"name": "Promo 3 Gin Tonic", "category": "promos", "price": 16000, "stock": 10},
    {"name": "Balde Cerveza x6", "category": "promos", "price": 12000, "stock": 5},
    {"name": "Promo Cumple!", "category": "promos", "price": 25000, "stock": 5},
]

SEED_TERMINALS = [
    {"name": "Barra Principal", "location": "Planta Baja"},
    {"name": "Barra VIP", "location": "VIP"},
]


async def seed():
    """Seed the database with initial data."""
    await init_db()
    print("✅ Tables created")

    async with async_session() as db:
        # Seed products
        for p in SEED_PRODUCTS:
            db.add(Product(**p))
        print(f"✅ {len(SEED_PRODUCTS)} products seeded")

        # Seed terminals
        for t in SEED_TERMINALS:
            db.add(Terminal(**t))
        print(f"✅ {len(SEED_TERMINALS)} terminals seeded")

        # Seed admin user
        admin = User(
            email="admin@tcq.club",
            hashed_password=hash_password("Admin2024!"),
            full_name="Admin TCQ",
            role="admin",
            is_verified=True,
            bonus_claimed=True,
        )
        db.add(admin)
        print("✅ Admin user created (admin@tcq.club / Admin2024!)")

        # Seed test barman
        barman = User(
            email="barman@tcq.club",
            hashed_password=hash_password("Barman2024!"),
            full_name="Barman TCQ",
            role="barman",
            is_verified=True,
            bonus_claimed=True,
        )
        db.add(barman)
        print("✅ Barman user created (barman@tcq.club / Barman2024!)")

        await db.commit()
        print("\n🎉 Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())

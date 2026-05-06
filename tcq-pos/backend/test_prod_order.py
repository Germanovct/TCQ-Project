import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.services.payment_service import PaymentService
from app.schemas.order import CreateOrderRequest, OrderItem
import uuid

DATABASE_URL = "postgresql+asyncpg://postgres.eofsbuuiejouxuyynutn:2OCozXkdwb1hBVxv@aws-1-us-west-2.pooler.supabase.com:5432/postgres"

async def test():
    engine = create_async_engine(DATABASE_URL)
    Session = async_sessionmaker(engine)
    async with Session() as db:
        order = CreateOrderRequest(
            items=[OrderItem(product_id=1, quantity=1)],
            method="MERCADO_PAGO",
            terminal_id=1,
            table_ref="barra",
            operator_id=uuid.UUID("d7313ce3-a968-442b-b428-adf66c47adb3") # barman
        )
        try:
            res = await PaymentService.process_order(db, order)
            print("Order result:", res)
        except Exception as e:
            print("Order error:", type(e).__name__, str(e))

asyncio.run(test())

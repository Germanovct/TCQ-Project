"""
TCQ POS — Product Model
Represents items available for sale (drinks, combos, promos).
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Numeric, Boolean, DateTime
)
from app.database import Base


class Product(Base):
    """
    Products table.
    
    Maps directly to the current frontend categories:
    - bebidas (non-alcoholic drinks)
    - tragos (cocktails)
    - promos (combos & promotions)
    """

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    category = Column(
        String(50),
        nullable=False,
        index=True,
    )  # bebidas | tragos | promos (extensible)
    price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self):
        return f"<Product {self.name} ${self.price} stock={self.stock}>"

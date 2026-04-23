"""
TCQ POS — Transaction & TransactionItem Models
Core financial record. Every sale creates a Transaction with line items.
Supports three payment methods: TCQ_BALANCE, MERCADO_PAGO, CASH.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Numeric, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.user import GUID


class Transaction(Base):
    """
    Transactions table.
    
    Every order creates one transaction. The transaction records:
    - WHO paid (user_id) — nullable for cash/anonymous sales
    - WHERE it was processed (terminal_id)
    - HOW they paid (method: TCQ_BALANCE | MERCADO_PAGO | CASH)
    - STATUS lifecycle (PENDING → COMPLETED | FAILED | REFUNDED)
    - Mercado Pago integration fields (preference_id, payment_id)
    - A JSON snapshot of items for historical reference
    """

    __tablename__ = "transactions"

    id = Column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Who paid — nullable for anonymous/cash sales
    user_id = Column(
        GUID(),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    # Which terminal processed the sale
    terminal_id = Column(
        Integer,
        ForeignKey("terminals.id"),
        nullable=False,
        index=True,
    )

    # Payment method
    method = Column(
        String(20),
        nullable=False,
    )  # TCQ_BALANCE | MERCADO_PAGO | CASH

    # Transaction lifecycle
    status = Column(
        String(20),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
    )  # PENDING | COMPLETED | FAILED | REFUNDED

    # Financial
    total_amount = Column(Numeric(12, 2), nullable=False)

    # Mercado Pago integration fields
    mp_preference_id = Column(String(255), nullable=True)
    mp_payment_id = Column(String(255), nullable=True)

    # Snapshot of items at time of sale (for historical integrity)
    items_snapshot = Column(JSON, nullable=True)

    # Table or location reference (for backward compatibility)
    table_ref = Column(String(20), nullable=True)  # "1"-"12" or "barra"

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="transactions")
    terminal = relationship("Terminal", back_populates="transactions")
    items = relationship(
        "TransactionItem",
        back_populates="transaction",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):
        return (
            f"<Transaction {self.id} method={self.method} "
            f"status={self.status} total=${self.total_amount}>"
        )


class TransactionItem(Base):
    """
    Transaction line items.
    
    Normalized line items for each transaction, enabling
    per-product sales analytics and inventory reconciliation.
    """

    __tablename__ = "transaction_items"

    id = Column(Integer, primary_key=True, autoincrement=True)

    transaction_id = Column(
        GUID(),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
    )

    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)

    # Relationships
    transaction = relationship("Transaction", back_populates="items")
    product = relationship("Product")

    def __repr__(self):
        return f"<TransactionItem product={self.product_id} qty={self.quantity} ${self.subtotal}>"

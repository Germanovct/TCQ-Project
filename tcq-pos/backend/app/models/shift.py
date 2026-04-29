"""
TCQ POS — CashRegisterShift Model
Tracks individual shift sessions for each terminal/cash register.
Each shift records who opened it, when, and all financial totals.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.user import GUID


class CashRegisterShift(Base):
    """
    Cash Register Shifts table.
    
    Each time a terminal is opened, a new shift record is created.
    When closed, totals are finalized. This enables:
    - Per-shift reporting for admin
    - Historical shift data
    - Detection of stale (unclosed) shifts from previous days
    """

    __tablename__ = "cash_register_shifts"

    id = Column(Integer, primary_key=True, autoincrement=True)

    terminal_id = Column(
        Integer,
        ForeignKey("terminals.id"),
        nullable=False,
        index=True,
    )

    # Who opened this shift
    operator_id = Column(
        GUID(),
        ForeignKey("users.id"),
        nullable=True,
    )

    # Shift label (Mañana / Tarde / Noche)
    shift_label = Column(String(20), nullable=False, default="General")

    # Financial tracking
    initial_balance = Column(Numeric(12, 2), default=0.00)
    total_cash = Column(Numeric(12, 2), default=0.00)
    total_tcq_balance = Column(Numeric(12, 2), default=0.00)
    total_mercado_pago = Column(Numeric(12, 2), default=0.00)
    grand_total = Column(Numeric(12, 2), default=0.00)
    transaction_count = Column(Integer, default=0)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Track items removed from cart after being committed
    voided_items = Column(JSON, default=list)

    # Timestamps
    opened_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    closed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    operator = relationship("User", foreign_keys=[operator_id])
    terminal = relationship("Terminal", back_populates="shifts")

    def __repr__(self):
        status = "ACTIVE" if self.is_active else "CLOSED"
        return (
            f"<Shift #{self.id} terminal={self.terminal_id} "
            f"[{status}] total=${self.grand_total}>"
        )

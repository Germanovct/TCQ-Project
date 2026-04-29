"""
TCQ POS — Terminal Model
Represents a physical POS terminal (tablet at the bar or a table station).
Each terminal tracks its own cash register session (open/close).
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, Numeric, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.user import GUID


class Terminal(Base):
    """
    Terminals table.
    
    Maps to the 'Caja' concept in the current system.
    Each terminal has its own shift lifecycle:
    - Open (with initial balance)
    - Process transactions during the shift
    - Close (with daily total report)
    """

    __tablename__ = "terminals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)  # e.g., "Barra Principal", "Mesa VIP"
    location = Column(String(100), nullable=True)  # e.g., "Planta Baja", "VIP"

    # Shift state
    is_open = Column(Boolean, default=False, nullable=False)
    initial_balance = Column(Numeric(12, 2), default=0.00)
    daily_total = Column(Numeric(12, 2), default=0.00)

    # Who opened this terminal
    operator_id = Column(
        GUID(),
        ForeignKey("users.id"),
        nullable=True,
    )

    # Current active shift
    active_shift_id = Column(Integer, nullable=True)

    # Shift timestamps
    opened_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    operator = relationship("User", foreign_keys=[operator_id])
    transactions = relationship("Transaction", back_populates="terminal", lazy="selectin")
    shifts = relationship("CashRegisterShift", back_populates="terminal", lazy="selectin")

    def __repr__(self):
        status = "OPEN" if self.is_open else "CLOSED"
        return f"<Terminal {self.name} [{status}] daily=${self.daily_total}>"

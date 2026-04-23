"""
TCQ POS — User Model
Represents club attendees with wallet balance and QR identity.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Numeric, DateTime, Text, Index, TypeDecorator, CHAR
)
from sqlalchemy.orm import relationship
from app.database import Base


class GUID(TypeDecorator):
    """Platform-independent UUID type. Uses CHAR(36) for SQLite, native UUID for PostgreSQL."""
    impl = CHAR(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return uuid.UUID(value) if not isinstance(value, uuid.UUID) else value
        return value


class User(Base):
    """
    Users table.
    
    Each user has:
    - A unique QR code for identification at the bar
    - A TCQ wallet balance (cashless system)
    - A bonus_claimed flag (activated only on first physical scan)
    - A role (customer, barman, admin)
    """

    __tablename__ = "users"

    id = Column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)

    # QR Code — unique identifier for scanning at the bar
    qr_code = Column(
        String(64),
        unique=True,
        nullable=False,
        default=lambda: uuid.uuid4().hex,
        index=True,
    )

    # Wallet / Cashless Balance
    tcq_balance = Column(
        Numeric(12, 2),
        nullable=False,
        default=0.00,
        server_default="0.00",
    )

    # Bonus system — NOT activated on registration.
    # Activated on first physical scan by barman.
    bonus_claimed = Column(Boolean, default=False, nullable=False)

    # Account status & role
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    role = Column(
        String(20),
        nullable=False,
        default="customer",
        server_default="customer",
    )  # customer | barman | admin

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

    # Relationships
    transactions = relationship("Transaction", back_populates="user", lazy="selectin")

    def __repr__(self):
        return f"<User {self.email} balance=${self.tcq_balance}>"

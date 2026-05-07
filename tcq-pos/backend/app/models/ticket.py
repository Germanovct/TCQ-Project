"""
TCQ POS — Ticket Model
Represents a purchased ticket instance with its unique QR code and purchaser info.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.user import GUID

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    
    # Relations
    ticket_type_id = Column(GUID(), ForeignKey("ticket_types.id"), nullable=False, index=True)
    event_id = Column(GUID(), ForeignKey("events.id"), nullable=False, index=True)
    
    # Optional relation: If the user is registered in the wallet
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=True, index=True)
    
    # Purchaser Info (Collected from checkout form)
    purchaser_first_name = Column(String(100), nullable=False)
    purchaser_last_name = Column(String(100), nullable=False)
    purchaser_age = Column(Integer, nullable=False)
    purchaser_email = Column(String(255), nullable=False)
    
    # Ticket State & Security
    qr_code = Column(String(100), unique=True, nullable=False, default=lambda: uuid.uuid4().hex, index=True)
    status = Column(String(50), default="valid") # valid, used, transferred, cancelled, pending_payment
    used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Payment Tracking
    mp_preference_id = Column(String(100), nullable=True)
    mp_payment_id = Column(String(100), nullable=True)
    
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
    ticket_type = relationship("TicketType", back_populates="tickets")
    user = relationship("User") # To allow displaying in tcq-client wallet

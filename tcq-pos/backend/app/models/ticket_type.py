"""
TCQ POS — Ticket Type Model
Represents the different types/tiers of tickets for an event (e.g. General, VIP, Courtesy).
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Numeric, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.user import GUID

class TicketType(Base):
    __tablename__ = "ticket_types"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    event_id = Column(GUID(), ForeignKey("events.id"), nullable=False, index=True)
    
    # Information
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Configuration
    category = Column(String(50), default="standard") # standard, multi, invite
    price = Column(Numeric(12, 2), nullable=False, default=0.00)
    stock = Column(Integer, nullable=False, default=0) # 0 means unlimited
    
    # State & Visibility
    state = Column(String(50), default="on_sale") # on_sale, secret, not_available
    is_visible = Column(Boolean, default=True) # Visible or hidden on the event page
    
    # Advanced Options
    is_transferable = Column(Boolean, default=True)
    entry_limit_time = Column(DateTime(timezone=True), nullable=True) # Limits access time
    discount_code = Column(String(50), nullable=True)
    
    # Multi-access (how many QRs per purchase)
    access_count = Column(Integer, default=1)
    
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
    event = relationship("Event", back_populates="ticket_types")
    tickets = relationship("Ticket", back_populates="ticket_type", cascade="all, delete-orphan")

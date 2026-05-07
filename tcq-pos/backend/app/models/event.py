"""
TCQ POS — Event Model
Represents an event (party, concert, etc.) within the platform.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.user import GUID

class Event(Base):
    __tablename__ = "events"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    
    # Basic Info
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    flyer_url = Column(String(500), nullable=True)

    
    # Visualization
    is_public = Column(Boolean, default=True, nullable=False) # True = public, False = private
    hide_from_sellers = Column(Boolean, default=False, nullable=False)
    
    # Dates
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    cutoff_time = Column(DateTime(timezone=True), nullable=True) # Corte de venta
    
    # Status
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

    # Relationships
    ticket_types = relationship("TicketType", back_populates="event", cascade="all, delete-orphan")

"""
TCQ POS — DJ Event Models
Manages DJ registrations and their 3-drink allocation per event.
Each DJ gets a unique QR code the barman scans to redeem drinks.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.user import GUID
import enum


class DrinkChoice(str, enum.Enum):
    TRAGO = "trago"
    SIN_ALCOHOL = "sin_alcohol"
    GASEOSA = "gaseosa"


class DJRegistration(Base):
    """
    DJ Registration table.
    
    Each DJ registers for an event and receives 3 consumptions.
    A unique QR code is generated for the barman to scan and redeem drinks.
    """
    __tablename__ = "dj_registrations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    
    # DJ info
    dj_name = Column(String(150), nullable=False)
    event_name = Column(String(200), nullable=False)
    event_date = Column(String(20), nullable=False)  # "2026-04-28"
    
    # Consumptions: 3 total
    drinks_total = Column(Integer, default=3, nullable=False)
    drinks_used = Column(Integer, default=0, nullable=False)
    
    # QR code for barman scanning
    qr_code = Column(String(100), unique=True, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship to redemptions
    redemptions = relationship("DJDrinkRedemption", back_populates="registration", lazy="selectin")

    @property
    def drinks_remaining(self):
        return max(0, self.drinks_total - self.drinks_used)

    def __repr__(self):
        return f"<DJ {self.dj_name} event={self.event_name} drinks={self.drinks_remaining}/{self.drinks_total}>"


class DJDrinkRedemption(Base):
    """
    Records each individual drink redemption by a DJ.
    """
    __tablename__ = "dj_drink_redemptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    registration_id = Column(
        GUID(),
        ForeignKey("dj_registrations.id"),
        nullable=False,
        index=True,
    )
    
    # What they chose
    drink_type = Column(String(20), nullable=False)  # trago, sin_alcohol, gaseosa
    
    # Who served it
    served_by = Column(String(150), nullable=True)
    
    # When
    redeemed_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    registration = relationship("DJRegistration", back_populates="redemptions")

    def __repr__(self):
        return f"<Redemption {self.drink_type} for reg={self.registration_id}>"

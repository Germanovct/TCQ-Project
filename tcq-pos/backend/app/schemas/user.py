"""
TCQ POS — User Schemas
Pydantic models for user registration, login, and profile responses.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserRegister(BaseModel):
    """Schema for new user registration."""
    email: EmailStr
    password: str
    full_name: str = Field(min_length=2, max_length=150)
    phone: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating an existing user."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class TopUpRequest(BaseModel):
    """Schema for adding balance to a user."""
    amount: float = Field(gt=0)
    method: str = Field(default="CASH", description="CASH or TRANSFER")


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user profile response (safe, no password)."""
    id: UUID
    email: str
    full_name: str
    phone: Optional[str] = None
    qr_code: str
    tcq_balance: float
    bonus_claimed: bool
    is_active: bool
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserBalanceResponse(BaseModel):
    """Schema for balance check / update responses."""
    user_id: UUID
    tcq_balance: float
    bonus_claimed: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT token response after login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

"""
TCQ POS — Product Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductCreate(BaseModel):
    """Schema for creating a new product."""
    name: str = Field(min_length=1, max_length=150)
    category: str = Field(min_length=1, max_length=50)
    price: float = Field(gt=0)
    stock: int = Field(ge=0, default=0)


class ProductUpdate(BaseModel):
    """Schema for updating an existing product."""
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    """Schema for product response."""
    id: int
    name: str
    category: str
    price: float
    stock: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

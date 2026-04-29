"""
TCQ POS — Order Schemas
Pydantic models for the /create-order endpoint and payment flow.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from uuid import UUID
from datetime import datetime


class OrderItem(BaseModel):
    """A single item in the order cart."""
    product_id: int
    quantity: int = Field(gt=0)


class CreateOrderRequest(BaseModel):
    """
    Request body for POST /create-order.
    
    The barman sends the cart items and selects the payment method:
    - TCQ_BALANCE: Debit from user's internal wallet (requires user_id)
    - MERCADO_PAGO: Generate dynamic QR for client to pay
    - CASH: Direct cash payment (no user required)
    """
    items: List[OrderItem] = Field(min_length=1)
    method: Literal["TCQ_BALANCE", "MERCADO_PAGO", "CASH"]
    terminal_id: int
    user_id: Optional[UUID] = None  # Required for TCQ_BALANCE
    table_ref: Optional[str] = None  # "1"-"12" or "barra"
    operator_id: Optional[UUID] = None  # Barman processing the sale


class OrderItemDetail(BaseModel):
    """Enriched item detail for response."""
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float


class CreateOrderResponse(BaseModel):
    """Response from /create-order."""
    transaction_id: UUID
    status: str  # COMPLETED | PENDING
    method: str
    total_amount: float
    items: List[OrderItemDetail]
    # Mercado Pago specific
    qr_data: Optional[str] = None
    mp_preference_id: Optional[str] = None
    # TCQ Balance specific
    remaining_balance: Optional[float] = None
    # Message
    message: str


class TransactionResponse(BaseModel):
    """Full transaction detail."""
    id: UUID
    user_id: Optional[UUID] = None
    operator_id: Optional[UUID] = None
    terminal_id: int
    method: str
    status: str
    total_amount: float
    table_ref: Optional[str] = None
    items_snapshot: Optional[dict] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

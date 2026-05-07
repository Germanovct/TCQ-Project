from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class TicketPurchaseRequest(BaseModel):
    ticket_type_id: UUID
    first_name: str
    last_name: str
    email: EmailStr

class TicketPurchaseResponse(BaseModel):
    success: bool
    ticket_id: str
    init_point: Optional[str] = None
    message: str

class TicketValidationRequest(BaseModel):
    qr_code: str

class TicketValidationResponse(BaseModel):
    success: bool
    message: str
    ticket: Optional[TicketResponse] = None

class TicketResponse(BaseModel):
    id: UUID
    event_id: UUID
    ticket_type_id: UUID
    status: str
    qr_code: str
    purchaser_first_name: str
    purchaser_last_name: str
    purchaser_email: str
    event_name: Optional[str] = None
    ticket_type_name: Optional[str] = None
    used_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

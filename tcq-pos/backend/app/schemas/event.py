from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import List, Optional
from uuid import UUID

# TICKET TYPE SCHEMAS
class TicketTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "standard"
    price: float
    stock: int = 0
    state: str = "on_sale"
    is_visible: bool = True
    is_transferable: bool = True
    entry_limit_time: Optional[datetime] = None
    discount_code: Optional[str] = None
    access_count: int = 1

class TicketTypeCreate(TicketTypeBase):
    pass

class TicketTypeResponse(TicketTypeBase):
    id: UUID
    event_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# EVENT SCHEMAS
class EventBase(BaseModel):
    name: str
    description: Optional[str] = None
    flyer_url: Optional[str] = None
    is_public: bool = True
    hide_from_sellers: bool = False
    start_time: datetime
    end_time: datetime
    cutoff_time: Optional[datetime] = None
    is_active: bool = True

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    ticket_types: List[TicketTypeResponse] = []
    model_config = ConfigDict(from_attributes=True)

# DASHBOARD STATS
class TicketStats(BaseModel):
    ticket_type_id: UUID
    name: str
    price: float
    state: str
    sold: int
    stock: int

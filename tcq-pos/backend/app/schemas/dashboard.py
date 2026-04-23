"""
TCQ POS — Dashboard Schemas
Pydantic models for WebSocket real-time events and reporting.
"""

from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class DashboardSaleEvent(BaseModel):
    """WebSocket event: a sale was completed."""
    event: str = "sale_completed"
    transaction_id: UUID
    terminal_id: int
    terminal_name: str
    total_amount: float
    method: str
    item_count: int
    timestamp: datetime


class DashboardStockAlert(BaseModel):
    """WebSocket event: product stock is low."""
    event: str = "stock_alert"
    product_id: int
    product_name: str
    remaining_stock: int
    timestamp: datetime


class DashboardTerminalEvent(BaseModel):
    """WebSocket event: terminal opened or closed."""
    event: str  # terminal_opened | terminal_closed
    terminal_id: int
    terminal_name: str
    operator_name: Optional[str] = None
    daily_total: Optional[float] = None
    timestamp: datetime


class DailySummary(BaseModel):
    """Response for daily sales summary."""
    date: str
    total_revenue: float
    transaction_count: int
    top_products: List[dict]  # [{name, quantity, revenue}]
    revenue_by_method: dict   # {TCQ_BALANCE: x, MERCADO_PAGO: y, CASH: z}
    active_terminals: int

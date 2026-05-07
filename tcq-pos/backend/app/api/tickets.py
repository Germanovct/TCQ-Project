import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database import get_db
from app.models.ticket import Ticket
from app.models.ticket_type import TicketType
from app.models.event import Event
from app.schemas.ticket import TicketPurchaseRequest, TicketPurchaseResponse, TicketResponse
from app.services.mercadopago_service import mp_service
from app.api.dashboard import broadcast_event

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Tickets"])

@router.post("/tickets/purchase", response_model=TicketPurchaseResponse)
async def purchase_ticket(req: TicketPurchaseRequest, db: AsyncSession = Depends(get_db)):
    # 1. Validate Ticket Type and Event
    tt_query = select(TicketType).options(selectinload(TicketType.event)).filter(TicketType.id == req.ticket_type_id)
    tt_result = await db.execute(tt_query)
    ticket_type = tt_result.scalar_one_or_none()
    
    if not ticket_type or not ticket_type.is_active:
        raise HTTPException(status_code=400, detail="El tipo de ticket no existe o no está activo.")
        
    event = ticket_type.event
    if not event.is_active or not event.is_public:
        raise HTTPException(status_code=400, detail="El evento no está disponible.")
        
    if ticket_type.stock <= 0:
        raise HTTPException(status_code=400, detail="Entradas agotadas para este tipo de ticket.")
        
    if req.age < 18:
        raise HTTPException(status_code=400, detail="Debes ser mayor de 18 años para comprar entradas.")
        
    # 2. Create Pending Ticket
    new_ticket = Ticket(
        id=uuid.uuid4(),
        ticket_type_id=ticket_type.id,
        event_id=event.id,
        purchaser_first_name=req.first_name,
        purchaser_last_name=req.last_name,
        purchaser_age=req.age,
        purchaser_email=req.email,
        status="pending_payment"
    )
    db.add(new_ticket)
    
    # 3. Generate MercadoPago Checkout Pro Preference
    items = [{
        "title": f"Entrada: {event.title} - {ticket_type.name}",
        "quantity": 1,
        "unit_price": float(ticket_type.price)
    }]
    
    mp_result = await mp_service.create_checkout_preference(str(new_ticket.id), items, req.email)
    
    if not mp_result["success"]:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error al conectar con MercadoPago.")
        
    new_ticket.mp_preference_id = mp_result["preference_id"]
    await db.commit()
    
    return TicketPurchaseResponse(
        success=True,
        ticket_id=str(new_ticket.id),
        init_point=mp_result["init_point"],
        message="Redirigiendo a Mercado Pago..."
    )

@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return ticket

async def send_ticket_email(email: str, ticket: Ticket, event: Event):
    """
    Mock Email Service
    In production, this would use an SMTP server or SendGrid/AWS SES.
    """
    logger.info("=" * 50)
    logger.info(f"📧 ENVIANDO EMAIL A: {email}")
    logger.info(f"ASUNTO: Tu entrada para {event.title} confirmada!")
    logger.info(f"CUERPO:")
    logger.info(f"Hola {ticket.purchaser_first_name},")
    logger.info(f"¡Gracias por tu compra! Tu entrada para '{event.title}' ha sido confirmada.")
    logger.info(f"Código QR: {ticket.qr_code}")
    logger.info("Para ver tus entradas cómodamente en tu celular, descarga o ingresa a Wallet TCQ (https://tcqlub.com)!")
    logger.info("=" * 50)

@router.post("/webhooks/mercadopago/ticket")
async def mercadopago_ticket_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Webhook that receives payment status updates from MercadoPago.
    """
    payload = await request.json()
    action = payload.get("action")
    data = payload.get("data", {})
    payment_id = data.get("id")
    
    if action == "payment.created" or action == "payment.updated":
        if not payment_id:
            return {"status": "ignored"}
            
        # Verify the payment status with MP API
        verify_res = await mp_service.verify_payment(str(payment_id))
        if not verify_res["success"]:
            return {"status": "error verifying"}
            
        status = verify_res.get("status")
        external_reference = verify_res.get("external_reference")
        
        if not external_reference:
            return {"status": "no reference"}
            
        try:
            ticket_id = uuid.UUID(external_reference)
        except ValueError:
            return {"status": "invalid reference"}
            
        ticket_query = select(Ticket).options(selectinload(Ticket.ticket_type), selectinload(Ticket.event)).filter(Ticket.id == ticket_id)
        result = await db.execute(ticket_query)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            return {"status": "ticket not found"}
            
        if status == "approved" and ticket.status == "pending_payment":
            # Complete the purchase
            ticket.status = "valid"
            ticket.mp_payment_id = str(payment_id)
            
            # Reduce Stock
            if ticket.ticket_type.stock > 0:
                ticket.ticket_type.stock -= 1
                
            await db.commit()
            
            # Broadcast event for real-time dashboard updates
            await broadcast_event({
                "event": "ticket_sold",
                "ticket_id": str(ticket.id),
                "event_id": str(ticket.event_id),
                "ticket_type_id": str(ticket.ticket_type_id),
                "message": f"🎟️ Nueva entrada vendida: {ticket.ticket_type.name} - ${ticket.ticket_type.price}"
            })
            
            # Send Email Mock
            await send_ticket_email(ticket.purchaser_email, ticket, ticket.event)
            
            return {"status": "approved, ticket generated"}
            
    return {"status": "received"}

import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database import get_db
from app.models.ticket import Ticket
from app.models.ticket_type import TicketType
from app.models.event import Event
from app.schemas.ticket import (
    TicketPurchaseRequest, 
    TicketPurchaseResponse, 
    TicketResponse, 
    TicketValidationRequest, 
    TicketValidationResponse
)
from app.services.mercadopago_service import mp_service
from app.services.email_service import email_service
from app.api.dashboard import broadcast_event
from app.utils.security import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Tickets"])

@router.post("/tickets/purchase")
async def purchase_ticket(
    req: TicketPurchaseRequest, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    try:
        # 1. Validate Ticket Type and Event
        tt_query = select(TicketType).options(selectinload(TicketType.event)).filter(TicketType.id == req.ticket_type_id)
        tt_result = await db.execute(tt_query)
        ticket_type = tt_result.scalar_one_or_none()
        
        if not ticket_type or ticket_type.state == "not_available":
            raise HTTPException(status_code=400, detail="El tipo de ticket no existe o no está activo.")
            
        event = ticket_type.event
        if not event.is_active or not event.is_public:
            raise HTTPException(status_code=400, detail="El evento no está disponible.")
            
        if ticket_type.stock <= 0:
            raise HTTPException(status_code=400, detail="Entradas agotadas para este tipo de ticket.")
            
        # 2. Create Ticket
        is_free = float(ticket_type.price) == 0
        clean_email = req.email.strip().lower()
        
        new_ticket = Ticket(
            id=uuid.uuid4(),
            ticket_type_id=ticket_type.id,
            event_id=event.id,
            purchaser_first_name=req.first_name,
            purchaser_last_name=req.last_name,
            purchaser_age=18,
            purchaser_email=clean_email,
            status="valid" if is_free else "pending_payment"
        )
        
        # Try to associate with existing user
        try:
            user_result = await db.execute(select(User).where(func.lower(User.email) == clean_email))
            existing_user = user_result.scalar_one_or_none()
            if existing_user:
                new_ticket.user_id = existing_user.id
        except Exception as e:
            logger.warning(f"⚠️ Could not associate user (maybe user_id column missing): {e}")
            # We continue even if association fails
            
        db.add(new_ticket)
        
        # 3. Handle Free Ticket
        if is_free:
            if ticket_type.stock > 0:
                ticket_type.stock -= 1
            await db.commit()
            
            try:
                await broadcast_event({
                    "event": "ticket_sold",
                    "ticket_id": str(new_ticket.id),
                    "event_id": str(new_ticket.event_id),
                    "ticket_type_id": str(new_ticket.ticket_type_id),
                    "message": f"🎟️ Nueva cortesía generada: {ticket_type.name}"
                })
            except: pass

            background_tasks.add_task(send_ticket_email, req.email, new_ticket, event)
            return {
                "success": True,
                "ticket_id": str(new_ticket.id),
                "qr_code": new_ticket.qr_code,
                "event_name": event.name,
                "message": "¡Entrada gratuita generada con éxito!"
            }

        # 4. Generate MercadoPago Checkout Pro Preference (for paid tickets)
        items = [{
            "title": f"Entrada: {event.name} - {ticket_type.name}",
            "quantity": 1,
            "unit_price": float(ticket_type.price)
        }]
        
        mp_result = await mp_service.create_checkout_preference(str(new_ticket.id), items, req.email)
        
        if not mp_result["success"]:
            await db.rollback()
            return {"success": False, "message": f"Error MercadoPago: {mp_result.get('error')}"}
            
        new_ticket.mp_preference_id = mp_result["preference_id"]
        await db.commit()
        
        return {
            "success": True,
            "ticket_id": str(new_ticket.id),
            "init_point": mp_result["init_point"],
            "message": "Redirigiendo a Mercado Pago..."
        }
    except Exception as e:
        logger.error(f"❌ Error in purchase_ticket: {str(e)}", exc_info=True)
        return {"success": False, "message": f"Error en el servidor: {str(e)}"}

@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return ticket

@router.post("/tickets/validate", response_model=TicketValidationResponse)
async def validate_ticket(req: TicketValidationRequest, db: AsyncSession = Depends(get_db)):
    """
    Validates a ticket by its QR code.
    If valid, marks it as used.
    """
    try:
        # Find ticket by QR code
        query = select(Ticket).options(
            selectinload(Ticket.event),
            selectinload(Ticket.ticket_type)
        ).filter(Ticket.qr_code == req.qr_code)
        result = await db.execute(query)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            return {
                "success": False, 
                "message": "❌ Ticket no encontrado. El código QR no es válido."
            }
        
        # Populate names for response
        ticket.event_name = ticket.event.name if ticket.event else "Evento Desconocido"
        ticket.ticket_type_name = ticket.ticket_type.name if ticket.ticket_type else "Ticket"
            
        if ticket.status == "used":
            return {
                "success": False, 
                "message": f"⚠️ Este ticket YA FUE USADO el {ticket.used_at.strftime('%d/%m %H:%M')} hs.",
                "ticket": ticket
            }
            
        if ticket.status != "valid":
            return {
                "success": False, 
                "message": f"🚫 El ticket no es válido (Estado: {ticket.status}).",
                "ticket": ticket
            }
            
        # If everything is OK, mark as used
        from datetime import datetime, timezone
        ticket.status = "used"
        ticket.used_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(ticket)
        
        # Broadcast for admin dashboard (optional but useful)
        try:
            await broadcast_event({
                "event": "ticket_validated",
                "ticket_id": str(ticket.id),
                "purchaser": f"{ticket.purchaser_first_name} {ticket.purchaser_last_name}",
                "message": f"✅ Ticket validado: {ticket.purchaser_first_name}"
            })
        except: pass
        
        return {
            "success": True,
            "message": f"✅ BIENVENIDO/A, {ticket.purchaser_first_name} {ticket.purchaser_last_name}!",
            "ticket": ticket
        }
        
    except Exception as e:
        logger.error(f"❌ Error validating ticket: {e}")
        return {
            "success": False,
            "message": f"Error interno al validar: {str(e)}"
        }

@router.get("/tickets/my-tickets", response_model=list[TicketResponse])
async def get_my_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all tickets associated with the logged-in user.
    Also attempts to link any unlinked tickets with the same email.
    """
    # Auto-link unlinked tickets with same email
    try:
        await db.execute(
            update(Ticket)
            .where(func.lower(Ticket.purchaser_email) == current_user.email.lower(), Ticket.user_id == None)
            .values(user_id=current_user.id)
        )
        await db.commit()
    except Exception as e:
        logger.warning(f"Could not auto-link tickets: {e}")

    query = select(Ticket).options(
        selectinload(Ticket.event),
        selectinload(Ticket.ticket_type)
    ).filter(
        Ticket.user_id == current_user.id,
        Ticket.status.in_(["valid", "used"])
    ).order_by(Ticket.created_at.desc())
    
    result = await db.execute(query)
    tickets = result.scalars().all()
    
    # Map relation names to schema fields
    for t in tickets:
        t.event_name = t.event.name if t.event else "Evento Desconocido"
        t.ticket_type_name = t.ticket_type.name if t.ticket_type else "Ticket"
        
    return tickets

async def send_ticket_email(email: str, ticket: Ticket, event: Event):
    """
    Sends a real email to the purchaser using SMTP.
    """
    try:
        ticket_data = {
            "purchaser_name": ticket.purchaser_first_name,
            "event_name": event.name,
            "ticket_type": ticket.ticket_type.name,
            "qr_code": ticket.qr_code,
            "date": ticket.created_at.strftime("%d/%m/%Y %H:%M")
        }
        await email_service.send_ticket_email(email, ticket_data)
    except Exception as e:
        logger.error(f"⚠️ Error sending ticket email: {e}")

@router.post("/webhooks/mercadopago/ticket")
async def mercadopago_ticket_webhook(
    request: Request, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
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
            
            
            # Send Email in background
            background_tasks.add_task(send_ticket_email, ticket.purchaser_email, ticket, ticket.event)
            
            return {"status": "approved, ticket generated"}
            
    return {"status": "received"}

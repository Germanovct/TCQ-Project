"""
TCQ POS — Bonus Service
Handles the first-scan bonus activation logic.

CRITICAL RULE: The $1000 bonus is NOT credited on registration.
It is activated ONLY when the barman performs the first physical QR scan.
"""

import logging
from decimal import Decimal
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.services.wallet_service import WalletService
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class BonusService:
    """
    Service for managing the first-scan welcome bonus.
    
    Flow:
    1. User registers → bonus_claimed = False, balance = $0
    2. User arrives at club and shows QR
    3. Barman scans QR → API call to /scan-qr
    4. If bonus_claimed == False:
       - Credit $1000 to balance
       - Set bonus_claimed = True
    5. Proceed with normal order flow
    """

    @staticmethod
    async def check_and_activate_bonus(
        db: AsyncSession,
        user_id: UUID,
    ) -> dict:
        """
        Check if user is eligible for the welcome bonus.
        If eligible, credit the bonus and mark as claimed.
        
        Returns a dict with:
        - bonus_activated: bool
        - bonus_amount: float (0 if already claimed)
        - new_balance: float
        """
        # Lock the user row to prevent double-activation
        result = await db.execute(
            select(User)
            .where(User.id == user_id)
            .with_for_update()
        )
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User {user_id} not found")

        if not user.is_active:
            raise ValueError("User account is inactive")

        # Already claimed — no bonus
        if user.bonus_claimed:
            return {
                "bonus_activated": False,
                "bonus_amount": 0.0,
                "new_balance": float(user.tcq_balance),
                "message": "Bonus already claimed",
            }

        # 🎁 Activate bonus!
        bonus_amount = Decimal(str(settings.BONUS_AMOUNT))
        new_balance = await WalletService.credit(db, user_id, bonus_amount)

        # Mark bonus as claimed
        user.bonus_claimed = True

        logger.info(
            f"🎁 BONUS ACTIVATED: user={user_id} "
            f"amount=${bonus_amount} new_balance=${new_balance}"
        )

        return {
            "bonus_activated": True,
            "bonus_amount": float(bonus_amount),
            "new_balance": float(new_balance),
            "message": f"¡Bienvenido a TCQ! Se acreditaron ${bonus_amount} a tu cuenta.",
        }

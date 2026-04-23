"""
TCQ POS — Wallet Service
Handles all TCQ Balance operations with atomic transactions.
Uses SELECT FOR UPDATE to prevent race conditions on concurrent debits.
"""

import logging
from decimal import Decimal
from uuid import UUID
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User

logger = logging.getLogger(__name__)


class InsufficientBalanceError(Exception):
    """Raised when user doesn't have enough TCQ balance."""
    def __init__(self, available: Decimal, required: Decimal):
        self.available = available
        self.required = required
        super().__init__(
            f"Insufficient balance: available=${available}, required=${required}"
        )


class WalletService:
    """
    Service for TCQ internal wallet operations.
    All monetary operations use SELECT FOR UPDATE to prevent race conditions.
    """

    @staticmethod
    async def get_balance(db: AsyncSession, user_id: UUID) -> Decimal:
        """Get current balance for a user."""
        result = await db.execute(
            select(User.tcq_balance).where(User.id == user_id)
        )
        balance = result.scalar_one_or_none()
        if balance is None:
            raise ValueError(f"User {user_id} not found")
        return Decimal(str(balance))

    @staticmethod
    async def debit(
        db: AsyncSession,
        user_id: UUID,
        amount: Decimal,
    ) -> Decimal:
        """
        Atomically debit an amount from user's TCQ balance.
        
        Uses SELECT FOR UPDATE to lock the row and prevent concurrent
        transactions from creating overdrafts (race condition prevention).
        
        Returns the new balance after debit.
        Raises InsufficientBalanceError if balance < amount.
        """
        # Lock the user row for this transaction
        result = await db.execute(
            select(User)
            .where(User.id == user_id)
            .with_for_update()  # 🔒 Prevents race conditions
        )
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User {user_id} not found")

        current_balance = Decimal(str(user.tcq_balance))
        debit_amount = Decimal(str(amount))

        if current_balance < debit_amount:
            raise InsufficientBalanceError(
                available=current_balance,
                required=debit_amount,
            )

        # Perform the debit
        new_balance = current_balance - debit_amount
        user.tcq_balance = new_balance

        logger.info(
            f"Wallet debit: user={user_id} amount=${amount} "
            f"balance: ${current_balance} → ${new_balance}"
        )

        return new_balance

    @staticmethod
    async def credit(
        db: AsyncSession,
        user_id: UUID,
        amount: Decimal,
    ) -> Decimal:
        """
        Atomically credit an amount to user's TCQ balance.
        Used for balance top-ups and bonus credits.
        
        Returns the new balance after credit.
        """
        result = await db.execute(
            select(User)
            .where(User.id == user_id)
            .with_for_update()
        )
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User {user_id} not found")

        current_balance = Decimal(str(user.tcq_balance))
        credit_amount = Decimal(str(amount))
        new_balance = current_balance + credit_amount
        user.tcq_balance = new_balance

        logger.info(
            f"Wallet credit: user={user_id} amount=${amount} "
            f"balance: ${current_balance} → ${new_balance}"
        )

        return new_balance

    @staticmethod
    async def refund(
        db: AsyncSession,
        user_id: UUID,
        amount: Decimal,
    ) -> Decimal:
        """
        Refund an amount back to user's wallet.
        Functionally identical to credit but logged differently.
        """
        result = await db.execute(
            select(User)
            .where(User.id == user_id)
            .with_for_update()
        )
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User {user_id} not found")

        current_balance = Decimal(str(user.tcq_balance))
        refund_amount = Decimal(str(amount))
        new_balance = current_balance + refund_amount
        user.tcq_balance = new_balance

        logger.info(
            f"Wallet REFUND: user={user_id} amount=${amount} "
            f"balance: ${current_balance} → ${new_balance}"
        )

        return new_balance

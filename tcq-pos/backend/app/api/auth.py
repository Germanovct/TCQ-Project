"""
TCQ POS — Auth API Routes
Registration (with fraud prevention), login, and QR scan bonus activation.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse, UserBalanceResponse, UserUpdate, TopUpRequest
from app.utils.security import hash_password, verify_password, create_access_token, get_current_user
from app.services.fraud_service import FraudService
from app.services.bonus_service import BonusService
from app.services.wallet_service import WalletService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user with fraud prevention checks."""
    is_valid, errors = FraudService.validate_registration(data.email, data.full_name, data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail={"errors": errors})
    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=data.email.lower().strip(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name.strip(),
        phone=data.phone,
        tcq_balance=0.00,
        bonus_claimed=False,
    )
    db.add(user)
    await db.flush()
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT token."""
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/scan-qr/{qr_code}", response_model=dict)
async def scan_qr(qr_code: str, db: AsyncSession = Depends(get_db)):
    """
    Barman scans user QR at the bar.
    Activates welcome bonus on first scan.
    Returns user info and balance.
    """
    result = await db.execute(select(User).where(User.qr_code == qr_code, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found or inactive")
    bonus_result = await BonusService.check_and_activate_bonus(db, user.id)
    return {
        "user": UserResponse.model_validate(user),
        "bonus": bonus_result,
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return current_user


@router.get("/balance", response_model=UserBalanceResponse)
async def get_balance(current_user: User = Depends(get_current_user)):
    """Get current user balance."""
    return UserBalanceResponse(user_id=current_user.id, tcq_balance=float(current_user.tcq_balance), bonus_claimed=current_user.bonus_claimed)


# ── User Balance Management ──

@router.post("/users/{user_id}/topup", response_model=UserBalanceResponse)
async def top_up_user(user_id: str, data: TopUpRequest, db: AsyncSession = Depends(get_db)):
    """Barman tops up a client's balance."""
    import uuid
    try:
        new_balance = await WalletService.credit(db, uuid.UUID(user_id), data.amount)
        await db.commit()
        return UserBalanceResponse(
            user_id=uuid.UUID(user_id),
            tcq_balance=float(new_balance),
            bonus_claimed=True
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error al cargar saldo")

# ── Barman Management ──

@router.post("/create-barman", response_model=UserResponse, status_code=201)
async def create_barman(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Create a new barman user. Only admins and barmen can create other barmen."""
    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=data.email.lower().strip(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name.strip(),
        phone=data.phone,
        role="barman",
        is_verified=True,
        bonus_claimed=True,
        tcq_balance=0.00,
    )
    db.add(user)
    await db.flush()
    return user


@router.get("/barmen", response_model=list[UserResponse])
async def list_barmen(db: AsyncSession = Depends(get_db)):
    """List all barman and admin users."""
    result = await db.execute(
        select(User).where(User.role.in_(["barman", "admin"]), User.is_active == True)
        .order_by(User.full_name)
    )
    return result.scalars().all()


@router.delete("/barmen/{user_id}")
async def deactivate_barman(user_id: str, db: AsyncSession = Depends(get_db)):
    """Deactivate a barman user."""
    import uuid
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot deactivate admin users")
    user.is_active = False
    return {"message": f"Barman '{user.full_name}' deactivated"}


@router.put("/barmen/{user_id}", response_model=UserResponse)
async def update_barman(user_id: str, data: UserUpdate, db: AsyncSession = Depends(get_db)):
    """Update a barman user."""
    import uuid
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if data.email and data.email.lower() != user.email:
        existing = await db.execute(select(User).where(User.email == data.email.lower()))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already registered by another user")
        user.email = data.email.lower()
        
    if data.full_name:
        user.full_name = data.full_name
        
    if data.password:
        user.hashed_password = hash_password(data.password)
        
    await db.commit()
    await db.refresh(user)
    return user


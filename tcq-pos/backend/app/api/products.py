"""
TCQ POS — Products API Routes
CRUD operations for the product catalog.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=list[ProductResponse])
async def list_products(category: str = None, db: AsyncSession = Depends(get_db)):
    """List all active products, optionally filtered by category."""
    query = select(Product).where(Product.is_active == True)
    if category:
        query = query.where(Product.category == category)
    result = await db.execute(query.order_by(Product.category, Product.name))
    return result.scalars().all()


@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)):
    """Create a new product."""
    product = Product(**data.model_dump())
    db.add(product)
    await db.flush()
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, data: ProductUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing product."""
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.flush()
    return product


@router.delete("/{product_id}")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Soft-delete a product (set is_active=False)."""
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    return {"message": f"Product '{product.name}' deactivated"}

"""
TCQ POS — FastAPI Application Entry Point
Initializes the app, mounts all routers, and sets up middleware.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db

# Import all routers
from app.api.auth import router as auth_router
from app.api.orders import router as orders_router
from app.api.products import router as products_router
from app.api.terminals import router as terminals_router
from app.api.webhooks import router as webhooks_router
from app.api.dashboard import router as dashboard_router
from app.api.dj import router as dj_router
from app.api.events import router as events_router
from app.api.tickets import router as tickets_router
from .migrate import migrate

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    logger.info("🚀 Starting TCQ POS System...")
    # Create tables on startup (dev only — use Alembic in production)
    if settings.DEBUG:
        await init_db()
        logger.info("✅ Database tables created/verified")
    
    # Run migrations (safe to run always as it uses IF NOT EXISTS)
    try:
        await migrate()
        logger.info("✅ Migrations applied")
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
    logger.info("✅ TCQ POS System ready!")
    yield
    logger.info("👋 Shutting down TCQ POS System...")


# Create uploads directory
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app = FastAPI(
    title="TCQ POS API",
    description=(
        "Sistema POS híbrido para el club TCQ. "
        "Soporta pagos con saldo interno (TCQ Balance), "
        "Mercado Pago (QR dinámico) y efectivo."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the React PWA frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",             # Frontend local de Vite
        "http://localhost:4173",             # Vite preview
        "https://tcq-project.onrender.com",  # Backend en producción
        "https://tcq-pos.netlify.app",       # Frontend en producción original
        "https://tcqlub.com",                # Dominios Custom
        "https://www.tcqlub.com",
        "https://pos.tcqlub.com",
        "https://client.tcqlub.com",
        "https://wallet.tcqlub.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to avoid raw 500s breaking CORS
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"❌ UNHANDLED ERROR: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(terminals_router, prefix="/api/v1")
app.include_router(webhooks_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(dj_router, prefix="/api/v1")
app.include_router(events_router, prefix="/api/v1")
app.include_router(tickets_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
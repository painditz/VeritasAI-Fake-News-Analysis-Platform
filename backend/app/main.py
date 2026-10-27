import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.model_service import ModelService
from backend.app.api.routes import router as api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("veritas_ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager that initializes model weights once at startup
    and handles graceful teardown.
    """
    logger.info("Initializing VeritasAI Backend...")
    model_service = ModelService.get_instance()
    try:
        model_service.load_model()
        logger.info("VeritasAI Model loaded and ready for inference.")
    except Exception as e:
        logger.error(f"Failed to load model on startup: {e}")
        # We don't crash the server so health endpoint can still report status
    yield
    logger.info("VeritasAI Backend shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Full-stack research-grade AI fake news analysis platform powered by fine-tuned BERT 6-class classifier.",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API router
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/", summary="Root health & metadata")
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_prefix": settings.API_PREFIX,
        "status": "operational",
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error_type": exc.__class__.__name__},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routes.models import router as models_router
from app.routes.products import router as products_router
from app.routes.policies import router as policies_router
from app.routes.projections import router as projections_router
from app.routes.scenarios import router as scenarios_router
from app.routes.inspector import router as inspector_router
from app.services.model_service import ModelService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

app = FastAPI(
    title="Lifelib Web Platform API",
    description="Actuarial calculation and projection service powered by lifelib & modelx",
    version="1.0.0",
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(products_router)
app.include_router(models_router)
app.include_router(policies_router)
app.include_router(projections_router)
app.include_router(scenarios_router)
app.include_router(inspector_router)

@app.on_event("startup")
def startup_event():
    # Warm up and load model into memory on server boot
    ModelService.get_instance()

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "engine": "lifelib & modelx"}


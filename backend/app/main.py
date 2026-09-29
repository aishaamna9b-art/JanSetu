from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import auth, requests, analytics, recommendations, simulator, briefs, impact, admin, clusters
from app.core.errors import AppError, app_error_handler
from app.core.firebase import init_firebase

init_firebase()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_exception_handler(AppError, app_error_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(requests.router, prefix=f"{settings.API_V1_STR}/requests", tags=["requests"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(recommendations.router, prefix=f"{settings.API_V1_STR}/recommendations", tags=["recommendations"])
app.include_router(simulator.router, prefix=f"{settings.API_V1_STR}/simulator", tags=["simulator"])
app.include_router(briefs.router, prefix=f"{settings.API_V1_STR}/briefs", tags=["briefs"])
app.include_router(impact.router, prefix=f"{settings.API_V1_STR}/impact", tags=["impact"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(clusters.router, prefix=f"{settings.API_V1_STR}/clusters", tags=["clusters"])

@app.get("/health")
def health_check():
    return {"status": "ok", "dev_mode": settings.DEV_MODE}

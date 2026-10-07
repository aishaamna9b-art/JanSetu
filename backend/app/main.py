from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import auth, requests, analytics, recommendations, simulator, briefs, impact, admin, clusters, users, regions
from app.core.errors import AppError, app_error_handler
from app.core.firebase import init_firebase

init_firebase()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_exception_handler(AppError, app_error_handler)

origins = [
    "*"
]
if settings.ALLOWED_ORIGINS:
    origins.extend([o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    try:
        from app.data.local_db import get_connection
        conn = get_connection()
        c = conn.cursor()
        
        # Check if demographics table exists (created by load_datasets)
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='demographics'")
        table_exists = c.fetchone()
        
        if not table_exists:
            count = 0
        else:
            c.execute("SELECT COUNT(*) FROM demographics")
            count = c.fetchone()[0]
            
        conn.close()
        
        if count == 0:
            print("Database empty, running load datasets and seed logic...")
            import sys
            import os
            # Ensure scripts directory is accessible
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if backend_dir not in sys.path:
                sys.path.append(backend_dir)
            from scripts.load_datasets import load_datasets
            load_datasets()
            from app.data.seed import main as seed_main
            seed_main()
    except Exception as e:
        print(f"Error during startup seeding: {e}")

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(requests.router, prefix=f"{settings.API_V1_STR}/requests", tags=["requests"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(recommendations.router, prefix=f"{settings.API_V1_STR}/recommendations", tags=["recommendations"])
app.include_router(simulator.router, prefix=f"{settings.API_V1_STR}/simulator", tags=["simulator"])
app.include_router(briefs.router, prefix=f"{settings.API_V1_STR}/briefs", tags=["briefs"])
app.include_router(impact.router, prefix=f"{settings.API_V1_STR}/impact", tags=["impact"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(clusters.router, prefix=f"{settings.API_V1_STR}/clusters", tags=["clusters"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(regions.router, prefix=f"{settings.API_V1_STR}", tags=["regions"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

from pathlib import Path
from sqlalchemy import inspect, text
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.core.config import settings
from app.db.session import Base, engine, SessionLocal
from app.data.demo.seed_data import seed_demo_database
from app.api.routes import (
    health_router,
    auth_router,
    dashboard_router,
    chat_router,
    crops_router,
    weather_router,
    schemes_router,
    fields_router
)

# Initialize database schema
Base.metadata.create_all(bind=engine)


def migrate_legacy_ownership_columns() -> None:
    legacy_columns = {
        "fields": {
            "owner_id": "INTEGER",
            "is_demo": "BOOLEAN NOT NULL DEFAULT 0",
        },
        "chat_sessions": {
            "owner_id": "INTEGER",
            "is_demo": "BOOLEAN NOT NULL DEFAULT 0",
        },
        "crop_assessments": {
            "owner_id": "INTEGER",
        },
    }
    inspector = inspect(engine)
    with engine.begin() as connection:
        for table_name, columns in legacy_columns.items():
            existing_columns = {
                column["name"]
                for column in inspector.get_columns(table_name)
            }
            for column_name, column_type in columns.items():
                if column_name not in existing_columns:
                    connection.execute(
                        text(
                            f"ALTER TABLE {table_name} "
                            f"ADD COLUMN {column_name} {column_type}"
                        )
                    )
            if "owner_id" in columns:
                connection.execute(
                    text(
                        f"CREATE INDEX IF NOT EXISTS ix_{table_name}_owner_id "
                        f"ON {table_name} (owner_id)"
                    )
                )


migrate_legacy_ownership_columns()

# Keep sample farm records out of production databases.
if settings.DEMO_DATA_ENABLED:
    try:
        with SessionLocal() as db:
            seed_demo_database(db)
    except Exception as exc:
        print(f"Demo seeding notice: {exc}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Context-Aware Agricultural AI Platform for Maharashtra and India.",
    docs_url="/docs",
    redoc_url="/redoc"
)
app_root = Path(__file__).resolve().parent.parent
frontend_candidates = (
    app_root / "frontend" / "dist",
    app_root.parent / "frontend" / "dist",
)
frontend_dist = next(
    (candidate for candidate in frontend_candidates if candidate.is_dir()),
    frontend_candidates[0],
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register v1 routes
prefix = settings.API_V1_PREFIX
app.include_router(health_router, prefix=prefix)
app.include_router(auth_router, prefix=prefix)
app.include_router(dashboard_router, prefix=prefix)
app.include_router(chat_router, prefix=prefix)
app.include_router(crops_router, prefix=prefix)
app.include_router(weather_router, prefix=prefix)
app.include_router(schemes_router, prefix=prefix)
app.include_router(fields_router, prefix=prefix)

@app.get("/")
def root():
    index_file = frontend_dist / "index.html"
    if settings.SERVE_FRONTEND and index_file.is_file():
        return FileResponse(index_file)

    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API v{settings.VERSION}",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health"
    }


@app.get("/{requested_path:path}", include_in_schema=False)
def serve_frontend_route(requested_path: str):
    if not settings.SERVE_FRONTEND or not (frontend_dist / "index.html").is_file():
        raise HTTPException(status_code=404, detail="Not found")
    if requested_path == "api" or requested_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")

    requested_file = (frontend_dist / requested_path).resolve()
    if frontend_dist.resolve() not in requested_file.parents:
        raise HTTPException(status_code=404, detail="Not found")
    if requested_file.is_file():
        return FileResponse(requested_file)
    if Path(requested_path).suffix:
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(frontend_dist / "index.html")

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Adjust PostgreSQL URL for synchronous driver if async isn't strictly requested initially
# But since this is FastAPI, we often use async or standard sync. The requirements say sqlalchemy and psycopg2-binary.
# psycopg2-binary implies synchronous.
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.DATABASE_URL.replace("postgres://", "postgresql://")
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from datetime import datetime

# 1. Fallback to SQLite string prevents the 'None' crash during local runs or builds
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./local_test.db")

# 2. Fix Render's 'postgres://' prefix for SQLAlchemy compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. Only apply SSL if we are actually connecting to a Postgres database
if "postgresql" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"sslmode": "require"},
    )
else:
    # Settings for local SQLite testing
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
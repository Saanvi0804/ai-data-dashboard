from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from database import create_tables, SessionLocal, Dataset
from routes import upload, dataset, stats, query, auth
from services.data_processor import delete_dataset
from datetime import datetime, timedelta
import os

app = FastAPI(title="AI Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(dataset.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(query.router, prefix="/api")
app.include_router(auth.router, prefix="/api")


def cleanup_old_datasets():
    """Delete datasets older than 24 hours."""
    print("Running cleanup job...")
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(hours=24)
        old_datasets = db.query(Dataset).filter(Dataset.created_at < cutoff).all()
        for record in old_datasets:
            delete_dataset(record.id)  # delete pickle file
            db.delete(record)
            print(f"Deleted dataset {record.id} for user {record.user_id}")
        db.commit()
        print(f"Cleanup done. Removed {len(old_datasets)} datasets.")
    finally:
        db.close()


@app.on_event("startup")
def startup():
    create_tables()
    # Run cleanup every hour
    scheduler = BackgroundScheduler()
    scheduler.add_job(cleanup_old_datasets, "interval", hours=1)
    scheduler.start()


@app.get("/")
def root():
    return {"message": "AI Dashboard API is running"}
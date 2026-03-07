from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from services.data_processor import parse_csv, save_dataset, get_dataset_info
from database import get_db, Dataset
from auth import get_current_user
import uuid

router = APIRouter()

@router.post("/")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    # This dependency is likely throwing the 401 "Not Authenticated"
    user_id: str = Depends(get_current_user), 
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication failed: No user ID found.")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()

    try:
        dataset_id = str(uuid.uuid4())[:8]
        df = parse_csv(contents)
        save_dataset(dataset_id, df)
        info = get_dataset_info(df)

        record = Dataset(
            id=dataset_id,
            user_id=user_id,
            filename=file.filename,
        )
        db.add(record)
        db.commit()

        return {
            "id": dataset_id,
            "filename": file.filename,
            "rows": info["rows"],
            "columns": info["columns"],
        }

    except Exception as e:
        # Improved error logging
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse CSV: {str(e)}")
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from services.data_processor import parse_csv, save_dataset, get_dataset_info
from database import get_db, Dataset
from auth import get_current_user
import uuid

router = APIRouter()


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()

    try:
        dataset_id = str(uuid.uuid4())[:8]
        df = parse_csv(contents)
        save_dataset(dataset_id, df)
        info = get_dataset_info(df)

        # Save dataset record to DB linked to user
        record = Dataset(
            id=dataset_id,
            user_id=user_id,
            filename=file.filename,
        )
        db.add(record)
        db.commit()

        return {
            "dataset_id": dataset_id,
            "filename": file.filename,
            "rows": info["rows"],
            "columns": info["columns"],
            "preview": info["preview"],
            "column_types": info["column_types"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse CSV: {str(e)}")
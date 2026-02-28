from fastapi import APIRouter, UploadFile, File, HTTPException
from services.data_processor import parse_csv, save_dataset, get_dataset_info
import uuid

router = APIRouter()

@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload a CSV file. Returns a dataset_id you can use for future queries.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()

    try:
        dataset_id = str(uuid.uuid4())[:8]  # Short unique ID
        df = parse_csv(contents)
        save_dataset(dataset_id, df)
        info = get_dataset_info(df)

        return {
            "dataset_id": dataset_id,
            "filename": file.filename,
            "rows": info["rows"],
            "columns": info["columns"],
            "preview": info["preview"],  # First 5 rows as JSON
            "column_types": info["column_types"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse CSV: {str(e)}")

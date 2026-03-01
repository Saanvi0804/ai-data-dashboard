from fastapi import APIRouter, HTTPException
from services.data_processor import load_dataset, get_dataset_info

router = APIRouter()

@router.get("/{dataset_id}")
def get_dataset(dataset_id: str):
    df = load_dataset(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    info = get_dataset_info(df)
    return {"dataset_id": dataset_id, **info}
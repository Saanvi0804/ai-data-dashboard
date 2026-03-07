from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from services.data_processor import parse_csv, save_dataset, get_dataset_info
from database import get_db, Dataset
from auth import get_current_user
import uuid
import os
import requests
import pandas as pd

router = APIRouter()


@router.post("/")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):

    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication failed.")

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

        summary = generate_dataset_summary(df)

        return {
            "id": dataset_id,
            "filename": file.filename,
            "rows": info["rows"],
            "columns": info["columns"],
            "preview": info["preview"],
            "column_types": info["column_types"],
            "summary": summary
        }

    except Exception as e:

        print(f"Upload error: {e}")

        raise HTTPException(status_code=500, detail=f"Failed to parse CSV: {str(e)}")


def generate_dataset_summary(df):

    try:

        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            return None

        column_info = []

        for col in df.columns:

            if pd.api.types.is_numeric_dtype(df[col]):
                column_info.append(f"{col} (numeric)")
            else:
                column_info.append(f"{col} (categorical)")

        prompt = f"""
You are a data analyst.

Describe this dataset in 1–2 sentences.

Rows: {len(df)}
Columns: {column_info}

Explain what the dataset likely represents.
"""

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 80,
            },
        )

        response.raise_for_status()

        return response.json()["choices"][0]["message"]["content"].strip()

    except:
        return None
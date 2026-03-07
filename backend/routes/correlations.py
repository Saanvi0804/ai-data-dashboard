from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.data_processor import load_dataset
import pandas as pd

router = APIRouter()


class CorrelationRequest(BaseModel):
    dataset_id: str


@router.post("/correlations")
def detect_correlations(req: CorrelationRequest):

    df = load_dataset(req.dataset_id)

    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    numeric_df = df.select_dtypes(include=["int64", "float64"])

    if numeric_df.shape[1] < 2:
        return {"correlations": []}

    corr_matrix = numeric_df.corr()

    results = []

    for i in range(len(corr_matrix.columns)):
        for j in range(i + 1, len(corr_matrix.columns)):

            col1 = corr_matrix.columns[i]
            col2 = corr_matrix.columns[j]

            corr_value = corr_matrix.iloc[i, j]

            if abs(corr_value) > 0.6:

                sample = df[[col1, col2]].dropna().head(200)

                data = [
                    {"x": float(row[col1]), "y": float(row[col2])}
                    for _, row in sample.iterrows()
                ]

                results.append({
                    "title": f"{col1} vs {col2}",
                    "type": "scatter",
                    "x": col1,
                    "y": col2,
                    "correlation": round(float(corr_value), 2),
                    "data": data
                })

    results = sorted(results, key=lambda x: abs(x["correlation"]), reverse=True)

    return {"correlations": results[:3]}
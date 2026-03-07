from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.data_processor import load_dataset
import numpy as np
import pandas as pd

router = APIRouter()

class CustomChartRequest(BaseModel):
    dataset_id: str
    x: str
    y: str | None = None
    chart_type: str  # bar, line, pie, scatter, histogram
    aggregation: str = "sum"  # sum, mean, count, none


@router.post("/custom-chart")
def custom_chart(req: CustomChartRequest):

    df = load_dataset(req.dataset_id)

    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if req.x not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{req.x}' not found.")

    if req.y and req.y not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{req.y}' not found.")

    try:

        # HISTOGRAM
        if req.chart_type == "histogram":

            series = pd.to_numeric(df[req.x], errors="coerce").dropna()

            if series.empty:
                raise HTTPException(
                    status_code=400,
                    detail="Column must contain numeric values for histogram."
                )

            counts, bin_edges = np.histogram(series, bins=10)

            data = [
                {
                    "label": f"{round(bin_edges[i],2)}-{round(bin_edges[i+1],2)}",
                    "value": int(counts[i])
                }
                for i in range(len(counts))
            ]

        # SCATTER
        elif req.chart_type == "scatter":

            if not req.y:
                raise HTTPException(
                    status_code=400,
                    detail="Scatter chart requires a Y column."
                )

            df[req.x] = pd.to_numeric(df[req.x], errors="coerce")
            df[req.y] = pd.to_numeric(df[req.y], errors="coerce")

            sample = df[[req.x, req.y]].dropna().head(300)

            data = [
                {"x": float(row[req.x]), "y": float(row[req.y])}
                for _, row in sample.iterrows()
            ]

        # BAR / LINE / PIE
        else:

            if not req.y:
                raise HTTPException(
                    status_code=400,
                    detail="This chart type requires a Y column."
                )

            # ensure numeric Y column
            df[req.y] = pd.to_numeric(df[req.y], errors="coerce")

            if req.aggregation == "sum":
                grouped = df.groupby(req.x, dropna=False)[req.y].sum()

            elif req.aggregation == "mean":
                grouped = df.groupby(req.x, dropna=False)[req.y].mean().round(2)

            elif req.aggregation == "count":
                grouped = df.groupby(req.x, dropna=False)[req.y].count()

            else:
                grouped = df[[req.x, req.y]].dropna()

                data = [
                    {
                        "label": str(row[req.x]),
                        "value": round(float(row[req.y]), 2)
                    }
                    for _, row in grouped.iterrows()
                ]

                return {"data": data}

            grouped = grouped.reset_index().sort_values(req.y, ascending=False)

            data = [
                {
                    "label": str(row[req.x]),
                    "value": round(float(row[req.y]), 2)
                }
                for _, row in grouped.iterrows()
            ]

        return {"data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.data_processor import load_dataset
import numpy as np
import pandas as pd
import os
import requests

router = APIRouter()


class CustomChartRequest(BaseModel):
    dataset_id: str
    x: str
    y: str | None = None
    chart_type: str
    aggregation: str = "sum"
    sort: str | None = "desc"
    top_n: int | None = None


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

            df[req.y] = pd.to_numeric(df[req.y], errors="coerce")

            if req.aggregation == "sum":
                grouped = df.groupby(req.x, dropna=False)[req.y].sum()

            elif req.aggregation == "mean":
                grouped = df.groupby(req.x, dropna=False)[req.y].mean().round(2)

            elif req.aggregation == "count":
                grouped = df.groupby(req.x, dropna=False)[req.y].count()

            else:
                grouped = df.groupby(req.x, dropna=False)[req.y].sum()

            grouped = grouped.reset_index()

            # Sorting
            if req.sort == "asc":
                grouped = grouped.sort_values(req.y, ascending=True)
            else:
                grouped = grouped.sort_values(req.y, ascending=False)

            # Top N
            if req.top_n:
                grouped = grouped.head(req.top_n)

            data = [
                {
                    "label": str(row[req.x]),
                    "value": round(float(row[req.y]), 2)
                }
                for _, row in grouped.iterrows()
            ]

        chart = {
            "title": f"{req.y} by {req.x}" if req.y else f"{req.x} distribution",
            "type": req.chart_type,
            "data": data
        }

        insight = generate_chart_insight(chart)

        return {
            "data": data,
            "insight": insight
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def generate_chart_insight(chart):

    try:

        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            return None

        prompt = f"""
You are a data analyst.

Explain the key insight from this chart.

Chart title: {chart['title']}

Chart data sample:
{chart['data'][:10]}

Write 1 short insight.
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
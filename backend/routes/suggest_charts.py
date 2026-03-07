from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.data_processor import load_dataset
import os
import json
import requests
import pandas as pd
import numpy as np

router = APIRouter()


class SuggestRequest(BaseModel):
    dataset_id: str


@router.post("/suggest-charts")
def suggest_charts(req: SuggestRequest):

    df = load_dataset(req.dataset_id)

    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set.")

    # Build dataset summary for LLM
    col_info = []

    for col in df.columns:

        if pd.api.types.is_numeric_dtype(df[col]):

            col_info.append(
                f"{col} (numeric): min={df[col].min()}, max={df[col].max()}, mean={round(float(df[col].mean()),2)}"
            )

        else:

            unique_count = df[col].nunique()
            sample = list(df[col].value_counts().head(5).index)

            col_info.append(
                f"{col} (categorical): {unique_count} unique values, examples: {sample}"
            )

    prompt = f"""
You are a data visualization expert.

Dataset has {len(df)} rows and these columns:
{chr(10).join(col_info)}

Suggest the 4 most insightful charts.

Return ONLY a valid JSON array.

Each item must contain:
"title"
"type"
"x"
"y"
"aggregation"
"description"

Rules:
- type: bar, line, pie, scatter, histogram
- pie: x categorical (<10 unique), y numeric
- bar: x categorical, y numeric
- line: x sequential or datetime
- scatter: x numeric and y numeric
- histogram: x numeric, y null
- use only dataset columns

Return JSON only.
"""

    try:

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 1000,
            },
            timeout=30,
        )

        response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"].strip()

        # Remove markdown if LLM returns it
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        suggestions = json.loads(content.strip())

        charts = []

        for suggestion in suggestions:

            try:

                chart_data = build_chart_data(df, suggestion)

                # Only return charts with valid data
                if chart_data and isinstance(chart_data, list) and len(chart_data) > 0:

                    charts.append({
                        "title": suggestion.get("title"),
                        "type": suggestion.get("type"),
                        "x": suggestion.get("x"),
                        "y": suggestion.get("y"),
                        "description": suggestion.get("description"),
                        "data": chart_data
                    })

            except Exception as e:
                print(f"Skipping chart {suggestion.get('title')}: {e}")
                continue

        return {"charts": charts}

    except Exception as e:

        import traceback
        traceback.print_exc()

        raise HTTPException(status_code=500, detail=str(e))


def build_chart_data(df, suggestion):

    chart_type = suggestion.get("type")
    x_col = suggestion.get("x")
    y_col = suggestion.get("y")
    aggregation = suggestion.get("aggregation", "none")

    if x_col not in df.columns:
        return None

    if y_col and y_col not in df.columns:
        return None

    # HISTOGRAM
    if chart_type == "histogram":

        series = pd.to_numeric(df[x_col], errors="coerce").dropna()

        if series.empty:
            return None

        counts, bin_edges = np.histogram(series, bins=10)

        return [
            {
                "label": f"{round(bin_edges[i],2)}-{round(bin_edges[i+1],2)}",
                "value": int(counts[i])
            }
            for i in range(len(counts))
        ]

    # SCATTER
    if chart_type == "scatter":

        if not y_col:
            return None

        df[x_col] = pd.to_numeric(df[x_col], errors="coerce")
        df[y_col] = pd.to_numeric(df[y_col], errors="coerce")

        sample = df[[x_col, y_col]].dropna().head(200)

        if sample.empty:
            return None

        return [
            {"x": float(row[x_col]), "y": float(row[y_col])}
            for _, row in sample.iterrows()
        ]

    # BAR / PIE / LINE

    if not y_col or aggregation == "none":
        return None

    df[y_col] = pd.to_numeric(df[y_col], errors="coerce")

    if aggregation == "sum":
        grouped = df.groupby(x_col)[y_col].sum()

    elif aggregation == "mean":
        grouped = df.groupby(x_col)[y_col].mean().round(2)

    elif aggregation == "count":
        grouped = df.groupby(x_col)[y_col].count()

    else:
        grouped = df.groupby(x_col)[y_col].sum()

    grouped = grouped.reset_index()

    if grouped.empty:
        return None

    return [
        {"label": str(row[x_col]), "value": round(float(row[y_col]), 2)}
        for _, row in grouped.iterrows()
    ]
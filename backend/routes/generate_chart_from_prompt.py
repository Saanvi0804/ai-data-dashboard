from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.data_processor import load_dataset
import os
import json
import requests
import pandas as pd
import numpy as np

router = APIRouter()


class PromptRequest(BaseModel):
    dataset_id: str
    prompt: str


@router.post("/generate-chart-from-prompt")
def generate_chart_from_prompt(req: PromptRequest):

    df = load_dataset(req.dataset_id)

    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set.")

    column_list = ", ".join(df.columns)

    prompt = f"""
You are a data visualization assistant.

Dataset columns:
{column_list}

User request:
"{req.prompt}"

Convert the request into a JSON chart specification.

Return JSON ONLY.

Format:

{{
"title": "...",
"type": "bar | line | pie | scatter | histogram",
"x": "column_name",
"y": "column_name or null",
"aggregation": "sum | mean | count | none",
"description": "short explanation"
}}
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
                "max_tokens": 400,
            },
            timeout=30,
        )

        response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"].strip()

        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        chart_spec = json.loads(content.strip())

        chart_data = build_chart_data(df, chart_spec)

        if not chart_data:
            raise HTTPException(status_code=400, detail="Could not generate chart data.")

        chart_spec["data"] = chart_data
        chart_spec["insight"] = generate_chart_insight(
            chart_spec,
            api_key
            )
        return {"chart": chart_spec}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def build_chart_data(df, spec):

    chart_type = spec.get("type")
    x_col = spec.get("x")
    y_col = spec.get("y")
    aggregation = spec.get("aggregation", "none")

    if x_col not in df.columns:
        return None

    if y_col and y_col not in df.columns:
        return None

    if chart_type == "histogram":

        series = pd.to_numeric(df[x_col], errors="coerce").dropna()

        if series.empty:
            return None

        counts, bins = np.histogram(series, bins=10)

        return [
            {
                "label": f"{round(bins[i],2)}-{round(bins[i+1],2)}",
                "value": int(counts[i])
            }
            for i in range(len(counts))
        ]


    if chart_type == "scatter":

        df[x_col] = pd.to_numeric(df[x_col], errors="coerce")
        df[y_col] = pd.to_numeric(df[y_col], errors="coerce")

        sample = df[[x_col, y_col]].dropna().head(200)

        return [
            {"x": float(row[x_col]), "y": float(row[y_col])}
            for _, row in sample.iterrows()
        ]


    if not y_col:
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

    return [
        {"label": str(row[x_col]), "value": round(float(row[y_col]), 2)}
        for _, row in grouped.iterrows()
    ]

def generate_chart_insight(chart, api_key):

    try:

        prompt = f"""
You are a data analyst.

Explain the key insight from this chart in 1–2 sentences.

Chart title: {chart['title']}
Chart data sample: {chart['data'][:10]}
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
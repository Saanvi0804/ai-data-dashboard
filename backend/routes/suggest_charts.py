from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.data_processor import load_dataset
import os
import json
import requests

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

    # Build column info
    col_info = []
    for col in df.columns:
        if df[col].dtype in ["int64", "float64"]:
            col_info.append(f"{col} (numeric): min={df[col].min()}, max={df[col].max()}, mean={round(float(df[col].mean()), 2)}")
        else:
            unique_count = df[col].nunique()
            sample = list(df[col].value_counts().head(5).index)
            col_info.append(f"{col} (categorical): {unique_count} unique values, examples: {sample}")

    prompt = f"""You are a data visualization expert. Analyze this dataset and suggest the 4 most insightful charts to generate.

Dataset has {len(df)} rows and these columns:
{chr(10).join(col_info)}

Return ONLY a valid JSON array with exactly 4 chart suggestions. Each suggestion must have:
- "title": descriptive chart title
- "type": one of "bar", "line", "pie", "scatter", "histogram"  
- "x": column name for x-axis (or category)
- "y": column name for y-axis (or value) — use null for histogram
- "aggregation": one of "sum", "mean", "count", "none" — how to aggregate y values grouped by x
- "description": one sentence explaining what insight this chart shows

Rules:
- For "pie" charts: x must be categorical with < 10 unique values, y must be numeric
- For "bar" charts: x should be categorical, y should be numeric  
- For "line" charts: x should be datetime or sequential, y should be numeric
- For "scatter" charts: both x and y must be numeric, aggregation must be "none"
- For "histogram": x must be numeric, y must be null
- Only use column names that exist in the dataset
- Return ONLY the JSON array, no explanation, no markdown"""

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
                "max_tokens": 1000,
                "temperature": 0.1,
            },
            timeout=30,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()

        # Strip markdown if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        suggestions = json.loads(content.strip())

        # Build actual chart data for each suggestion
        charts = []
        for s in suggestions:
            try:
                chart_data = build_chart_data(df, s)
                if chart_data:
                    charts.append({**s, "data": chart_data})
            except Exception as e:
                print(f"Skipping chart {s.get('title')}: {e}")
                continue

        return {"charts": charts}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


def build_chart_data(df, suggestion):
    """Build chart data based on AI suggestion."""
    chart_type = suggestion["type"]
    x_col = suggestion["x"]
    y_col = suggestion.get("y")
    aggregation = suggestion.get("aggregation", "none")

    # Validate columns exist
    if x_col not in df.columns:
        return None
    if y_col and y_col not in df.columns:
        return None

    if chart_type == "histogram":
        counts, bin_edges = __import__("numpy").histogram(df[x_col].dropna(), bins=10)
        return [
            {"label": f"{round(bin_edges[i], 2)}-{round(bin_edges[i+1], 2)}", "value": int(counts[i])}
            for i in range(len(counts))
        ]

    if chart_type == "scatter":
        sample = df[[x_col, y_col]].dropna().head(200)
        return [{"x": row[x_col], "y": row[y_col]} for _, row in sample.iterrows()]

    if aggregation == "none" or not y_col:
        return None

    # Aggregate
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
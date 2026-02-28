from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.data_processor import load_dataset
import os
import json
import traceback
import requests

router = APIRouter()

class QueryRequest(BaseModel):
    dataset_id: str
    question: str
    history: list = []

@router.post("/query")
def query_data(req: QueryRequest):
    print("=== QUERY RECEIVED ===")
    print("dataset_id:", req.dataset_id)

    df = load_dataset(req.dataset_id)
    print("df loaded:", df is not None)

    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    api_key = os.getenv("GROQ_API_KEY")
    print("api_key present:", bool(api_key))

    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set.")

    print("building context...")

    # Build context about the dataset
    col_info = []
    for col in df.columns:
        if df[col].dtype in ["int64", "float64"]:
            col_info.append(
                f"- {col} (numeric): min={df[col].min()}, max={df[col].max()}, "
                f"mean={round(float(df[col].mean()), 2)}, sum={round(float(df[col].sum()), 2)}"
            )
        else:
            top = df[col].value_counts().head(5).to_dict()
            col_info.append(
                f"- {col} (categorical): {len(df[col].unique())} unique values, top: {top}"
            )

    sample = df.head(5).fillna("").to_dict(orient="records")

    system_prompt = f"""You are a data analyst assistant. The user has uploaded a CSV dataset and is asking questions about it.

Dataset info:
- Rows: {len(df)}
- Columns: {list(df.columns)}

Column details:
{chr(10).join(col_info)}

Sample rows:
{json.dumps(sample, indent=2)}

Answer the user's question based on this data. Be concise and specific.
Use actual numbers from the data. If asked for comparisons or rankings, give exact values.
Format numbers nicely (e.g. $1,234.56 for currency, commas for large numbers).
Keep answers to 2-4 sentences unless a list is clearly better."""

    # Build message history
    messages = []
    for msg in req.history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": req.question})

    print("calling groq api...")

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "system", "content": system_prompt}] + messages,
                "max_tokens": 512,
                "temperature": 0.3,
            },
            timeout=30,
        )
        print("STATUS CODE:", response.status_code)
        print("RESPONSE:", response.text[:500])
        response.raise_for_status()
        answer = response.json()["choices"][0]["message"]["content"]
        print("answer received:", answer[:100])
        return {"answer": answer}

    except requests.exceptions.HTTPError as e:
        print("HTTP ERROR:", e.response.text)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Groq API error: {e.response.text}")
    except Exception as e:
        print("EXCEPTION:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
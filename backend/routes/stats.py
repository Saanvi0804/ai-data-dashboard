from fastapi import APIRouter, HTTPException
from services.data_processor import load_dataset

router = APIRouter()

@router.get("/stats/{dataset_id}")
def get_stats(dataset_id: str):
    df = load_dataset(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    stats = {}
    for col in df.columns:
        col_stats = {
            "type": "numeric" if df[col].dtype in ["int64", "float64"] else "categorical",
            "null_count": int(df[col].isnull().sum()),
            "unique_count": int(df[col].nunique()),
        }
        if col_stats["type"] == "numeric":
            col_stats.update({
                "mean": round(float(df[col].mean()), 2),
                "min": round(float(df[col].min()), 2),
                "max": round(float(df[col].max()), 2),
                "sum": round(float(df[col].sum()), 2),
            })
        else:
            # Top 5 most frequent values for categorical
            top = df[col].value_counts().head(5)
            col_stats["top_values"] = [
                {"value": str(k), "count": int(v)}
                for k, v in top.items()
            ]
        stats[col] = col_stats

    # Pre-built chart data for common charts
    charts = {}

    # Revenue over time (if date + revenue columns exist)
    if "date" in df.columns and "revenue" in df.columns:
        df["date"] = df["date"].astype(str)
        rev_by_date = df.groupby("date")["revenue"].sum().reset_index()
        charts["revenue_over_time"] = rev_by_date.to_dict(orient="records")

    # Top products by revenue
    if "product" in df.columns and "revenue" in df.columns:
        top_products = (
            df.groupby("product")["revenue"]
            .sum()
            .sort_values(ascending=False)
            .head(8)
            .reset_index()
        )
        charts["top_products"] = top_products.to_dict(orient="records")

    # Revenue by category
    if "category" in df.columns and "revenue" in df.columns:
        by_cat = df.groupby("category")["revenue"].sum().reset_index()
        charts["revenue_by_category"] = by_cat.to_dict(orient="records")

    # Revenue by region
    if "region" in df.columns and "revenue" in df.columns:
        by_region = df.groupby("region")["revenue"].sum().reset_index()
        charts["revenue_by_region"] = by_region.to_dict(orient="records")

    return {"stats": stats, "charts": charts}

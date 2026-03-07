import pandas as pd
import io
import os
import pickle
import logging

# Setup basic logging to catch errors in the background
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

STORAGE_DIR = "./data"
os.makedirs(STORAGE_DIR, exist_ok=True)

def parse_csv(contents: bytes) -> pd.DataFrame:
    try:
        return pd.read_csv(io.BytesIO(contents), low_memory=False)
    except:
        return pd.read_csv(io.BytesIO(contents), encoding="latin1")

def save_dataset(dataset_id: str, df: pd.DataFrame):
    path = os.path.join(STORAGE_DIR, f"{dataset_id}.pkl")
    try:
        with open(path, "wb") as f:
            pickle.dump(df, f)
        logger.info(f"Dataset {dataset_id} saved successfully.")
    except Exception as e:
        logger.error(f"Failed to save dataset {dataset_id}: {e}")
        raise e

def load_dataset(dataset_id: str) -> pd.DataFrame | None:
    path = os.path.join(STORAGE_DIR, f"{dataset_id}.pkl")
    if not os.path.exists(path):
        logger.warning(f"Dataset file {path} not found.")
        return None
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception as e:
        logger.error(f"Error loading pickle file {dataset_id}: {e}")
        return None

def delete_dataset(dataset_id: str):
    path = os.path.join(STORAGE_DIR, f"{dataset_id}.pkl")
    if os.path.exists(path):
        os.remove(path)

def get_dataset_info(df: pd.DataFrame) -> dict:

    column_types = {}
    stats = {}

    for col in df.columns:

        if pd.api.types.is_numeric_dtype(df[col]):
            column_types[col] = "numeric"

            stats[col] = {
                "type": "numeric",
                "mean": float(df[col].mean()),
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "sum": float(df[col].sum()),
                "null_count": int(df[col].isna().sum()),
                "unique_count": int(df[col].nunique())
            }

        else:
            column_types[col] = "categorical"

            top_vals = (
                df[col]
                .value_counts()
                .head(5)
                .to_dict()
            )

            stats[col] = {
                "type": "categorical",
                "null_count": int(df[col].isna().sum()),
                "unique_count": int(df[col].nunique()),
                "top_values": [
                    {"value": str(k), "count": int(v)}
                    for k, v in top_vals.items()
                ]
            }

    return {
        "rows": len(df),
        "columns": list(df.columns),
        "column_types": column_types,
        "preview": df.head(5).fillna("").to_dict(orient="records"),
        "stats": stats
    }
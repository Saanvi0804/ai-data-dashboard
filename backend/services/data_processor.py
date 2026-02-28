import pandas as pd
import io
import os
import pickle

# Simple file-based storage for now (we'll swap to PostgreSQL in Phase 2)
STORAGE_DIR = "./data"
os.makedirs(STORAGE_DIR, exist_ok=True)


def parse_csv(contents: bytes) -> pd.DataFrame:
    """Parse raw CSV bytes into a Pandas DataFrame."""
    return pd.read_csv(io.BytesIO(contents))


def save_dataset(dataset_id: str, df: pd.DataFrame):
    """Save a DataFrame to disk using pickle."""
    path = os.path.join(STORAGE_DIR, f"{dataset_id}.pkl")
    with open(path, "wb") as f:
        pickle.dump(df, f)


def load_dataset(dataset_id: str) -> pd.DataFrame | None:
    """Load a DataFrame from disk. Returns None if not found."""
    path = os.path.join(STORAGE_DIR, f"{dataset_id}.pkl")
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return pickle.load(f)


def get_dataset_info(df: pd.DataFrame) -> dict:
    """Extract useful metadata from a DataFrame."""
    column_types = {}
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            column_types[col] = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            column_types[col] = "datetime"
        else:
            column_types[col] = "categorical"

    return {
        "rows": len(df),
        "columns": list(df.columns),
        "column_types": column_types,
        # Convert first 5 rows to a list of dicts (JSON-serializable)
        "preview": df.head(5).fillna("").to_dict(orient="records"),
    }

import pandas as pd
import io
import os
import pickle

STORAGE_DIR = "./data"
os.makedirs(STORAGE_DIR, exist_ok=True)


def parse_csv(contents: bytes) -> pd.DataFrame:
    return pd.read_csv(io.BytesIO(contents))


def save_dataset(dataset_id: str, df: pd.DataFrame):
    path = os.path.join(STORAGE_DIR, f"{dataset_id}.pkl")
    with open(path, "wb") as f:
        pickle.dump(df, f)


def load_dataset(dataset_id: str) -> pd.DataFrame | None:
    path = os.path.join(STORAGE_DIR, f"{dataset_id}.pkl")
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return pickle.load(f)


def delete_dataset(dataset_id: str):
    """Delete a dataset pickle file from disk."""
    path = os.path.join(STORAGE_DIR, f"{dataset_id}.pkl")
    if os.path.exists(path):
        os.remove(path)


def get_dataset_info(df: pd.DataFrame) -> dict:
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
        "preview": df.head(5).fillna("").to_dict(orient="records"),
    }
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
        # Added handling for different encodings which often crash CSV uploads
        return pd.read_csv(io.BytesIO(contents), encoding='utf-8')
    except UnicodeDecodeError:
        return pd.read_csv(io.BytesIO(contents), encoding='latin1')

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
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            column_types[col] = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            column_types[col] = "datetime"
        else:
            # Check if strings are actually dates but stored as objects
            column_types[col] = "categorical"

    return {
        "rows": len(df),
        "columns": list(df.columns),
        "column_types": column_types,
        # fillna("") is crucial so JSON doesn't break on NaN values
        "preview": df.head(10).fillna("").to_dict(orient="records"),
    }
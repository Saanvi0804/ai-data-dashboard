# AI Data Dashboard

Upload any CSV and explore your data with AI-powered insights.

## Project Structure

```
ai-dashboard/
├── backend/          # FastAPI + Python
│   ├── main.py
│   ├── routes/
│   │   ├── upload.py       # POST /api/upload
│   │   └── dataset.py      # GET /api/dataset/:id
│   ├── services/
│   │   └── data_processor.py
│   └── requirements.txt
│
├── frontend/         # Next.js + Tailwind
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Main page
│   │   │   └── layout.tsx
│   │   └── components/
│   │       ├── UploadZone.tsx  # Drag & drop uploader
│   │       ├── DataTable.tsx   # CSV preview table
│   │       └── StatsBar.tsx    # Column type badges
│   └── package.json
│
└── docker-compose.yml
```

## Phase Progress

- [x] Phase 1 — Upload CSV + render table
- [ ] Phase 2 — Auto stats, column charts
- [ ] Phase 3 — AI natural language queries
- [ ] Phase 4 — Smart chart suggestions
- [ ] Phase 5 — Auth + deploy

---

## Running Locally (Without Docker)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# Runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:3000
```

---

## Running with Docker

```bash
docker-compose up --build
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload a CSV file |
| GET | `/api/dataset/:id` | Fetch a dataset by ID |

### Example Upload Response

```json
{
  "dataset_id": "a3f2c1b4",
  "filename": "sales.csv",
  "rows": 1500,
  "columns": ["date", "revenue", "region", "product"],
  "column_types": {
    "date": "categorical",
    "revenue": "numeric",
    "region": "categorical",
    "product": "categorical"
  },
  "preview": [...]
}
```

---

## What's Next (Phase 2)

- Auto-detect datetime columns properly
- Generate summary stats per column (mean, min, max, nulls)
- Plot a bar chart for any column using Recharts
- Swap file storage for PostgreSQL

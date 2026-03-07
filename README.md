# AI Data Dashboard 📊🤖

An AI-powered data analytics dashboard that allows users to upload CSV datasets and instantly explore insights through automatic visualizations, AI-generated charts, natural language prompts, and statistical analysis.

Built with **Next.js**, **FastAPI**, and modern data visualization libraries, the platform transforms raw CSV data into interactive insights with minimal user effort.

---

## 🚀 Live Demo

| Service | URL |
|--------|-----|
| Frontend | [https://ai-data-dashboard-1.onrender.com](https://ai-data-dashboard-1.onrender.com) |
| Backend API | [https://ai-data-dashboard.onrender.com](https://ai-data-dashboard.onrender.com) |

---

## ✨ Features

### 📂 CSV Upload & Dataset Exploration
- Upload any CSV dataset
- Automatic dataset profiling
- Preview rows and column statistics
- AI-generated dataset summary

### 🤖 AI Chart Generation
Automatically generates insightful charts using LLM reasoning:
- Bar charts, Line charts, Pie charts, Histograms, Scatter plots
- Charts are generated based on dataset structure and statistical relationships

### 🧠 AI Prompt-Based Chart Builder
Generate charts using natural language:
```
show average score by subject
```
The system interprets the request and generates the appropriate visualization.

### 📊 Smart Correlation Detection
Automatically detects strong relationships between numeric variables and visualizes them as scatter plots.
```
Math Score vs Reading Score (Correlation: 0.81)
```

### 🔧 Custom Chart Builder
Manually create charts by selecting:
- X-axis and Y-axis columns
- Chart type
- Aggregation method (sum, mean, count)
- Sorting order and Top-N filtering

Charts include AI-generated insights explaining the results.

### 💡 AI Insight Generation
Every visualization includes an automatically generated explanation:
```
Students with higher math scores tend to also perform well in reading,
indicating strong academic correlation.
```

### 📥 Chart Export
Export charts as high-resolution PNG images using client-side rendering — useful for reports and presentations.

### 💬 AI Data Assistant
Ask questions about your dataset using natural language:
```
Which subject has the highest average score?
```
The AI analyzes the dataset and returns contextual answers.

### 📑 Dataset Summary
AI automatically generates a brief description of the dataset structure and meaning:
```
This dataset contains student performance metrics across multiple subjects,
including demographic attributes and exam scores.
```

### 💾 Persistent Session State
- Uploaded datasets are remembered
- Generated and prompt-based charts persist across navigation

---

## 🧱 Architecture

```
Frontend (Next.js + React)
│
│  REST API
▼
Backend (FastAPI)
│
├── AI services (Groq LLM)
├── Data processing (Pandas)
├── Chart generation
└── Dataset storage (SQLAlchemy)
```

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, React, TypeScript, TailwindCSS, Recharts, html2canvas |
| **Backend** | FastAPI, Python, Pandas, NumPy, SQLAlchemy |
| **AI / LLM** | Groq API, LLaMA 3.3 70B |
| **Deployment** | Render (frontend + backend) |

---

## 📂 Project Structure

```
ai-data-dashboard/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── AskAI.tsx
│   │   │   ├── AuthForm.tsx
│   │   │   ├── ChartBuilder.tsx
│   │   │   ├── Charts.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── ExportReport.tsx
│   │   │   ├── SmartCharts.tsx
│   │   │   ├── StatsBar.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   └── UploadZone.tsx
│   │   └── context/
│   │       └── AuthContext.tsx
│   ├── next-env.d.ts
│   ├── package.json
│   └── package-lock.json
│
└── backend/
    ├── routes/
    │   ├── auth.py
    │   ├── correlations.py
    │   ├── custom_chart.py
    │   ├── dataset.py
    │   ├── generate_chart_from_prompt.py
    │   ├── query.py
    │   ├── stats.py
    │   ├── suggest_charts.py
    │   └── upload.py
    ├── services/
    │   └── data_processor.py
    ├── auth.py
    ├── database.py
    ├── main.py
    ├── requirements.txt
    └── .env
```

---

## ⚙️ Installation (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/Saanvi0804/ai-data-dashboard.git
cd ai-data-dashboard
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file and add your API key:
```
GROQ_API_KEY=your_api_key_here
```

Start the backend:
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: [http://localhost:3000](http://localhost:3000)

---

## 📊 Example Workflow

```
1️⃣  Upload a CSV dataset
2️⃣  View dataset preview and column statistics
3️⃣  Explore AI-generated charts
4️⃣  Generate custom charts with natural language prompts
5️⃣  Detect correlations automatically
6️⃣  Export charts for reporting
```

---

## 📈 Future Improvements

- PDF analytics report generation
- Drag-and-drop dashboard builder
- Time-series forecasting
- Data cleaning suggestions
- Dataset versioning
- Collaborative dashboards

---

## 👩‍💻 Author

**Saanvi Shetty** — Computer Science Student  
AI · Data Systems · Web Development

[![GitHub](https://img.shields.io/badge/GitHub-Saanvi0804-181717?logo=github)](https://github.com/Saanvi0804)

---

## ⭐ Support

If you find this project useful, give it a star ⭐ — it helps a lot!
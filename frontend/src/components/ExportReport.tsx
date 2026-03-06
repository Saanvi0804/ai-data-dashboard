"use client";

import { useState } from "react";
import axios from "axios";

const API = "https://ai-data-dashboard.onrender.com";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  datasetId: string;
  filename: string;
  rows: number;
  columns: string[];
  columnTypes: Record<string, "numeric" | "categorical" | "datetime">;
  messages: Message[];
}

export default function ExportReport({ datasetId, filename, rows, columns, columnTypes, messages }: Props) {
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Ask AI for a summary
      const res = await axios.post(`${API}/api/query`, {
        dataset_id: datasetId,
        question: "Give me a comprehensive analysis of this dataset. Include: 1) What this dataset is about, 2) Key statistics and patterns, 3) Notable findings, 4) Any recommendations. Be thorough but concise.",
        history: [],
      });

      const summary = res.data.answer;
      const numericCols = columns.filter(c => columnTypes[c] === "numeric");
      const categoricalCols = columns.filter(c => columnTypes[c] === "categorical");

      // Build HTML report
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Data Analysis Report - ${filename}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1f2937; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 28px; color: #111827; border-bottom: 3px solid #6366f1; padding-bottom: 12px; margin-bottom: 8px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
    h2 { font-size: 18px; color: #374151; margin: 28px 0 12px; padding-left: 12px; border-left: 4px solid #6366f1; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: #6366f1; }
    .stat-label { font-size: 12px; color: #9ca3af; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .columns-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 24px; }
    .col-badge { background: #f3f4f6; border-radius: 8px; padding: 8px 12px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
    .col-type { font-size: 11px; padding: 2px 8px; border-radius: 999px; font-weight: 500; }
    .numeric { background: #dbeafe; color: #1d4ed8; }
    .categorical { background: #dcfce7; color: #15803d; }
    .datetime { background: #fef9c3; color: #a16207; }
    .summary { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; line-height: 1.7; font-size: 14px; white-space: pre-wrap; }
    .chat-section { margin-top: 8px; }
    .message { margin-bottom: 12px; padding: 12px 16px; border-radius: 10px; font-size: 14px; line-height: 1.6; }
    .user-msg { background: #eef2ff; border-left: 4px solid #6366f1; }
    .assistant-msg { background: #f9fafb; border-left: 4px solid #10b981; }
    .msg-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .user-label { color: #6366f1; }
    .assistant-label { color: #10b981; }
    footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
  </style>
</head>
<body>
  <h1>📊 Data Analysis Report</h1>
  <div class="meta">
    File: <strong>${filename}</strong> &nbsp;·&nbsp;
    Generated: <strong>${new Date().toLocaleString()}</strong>
  </div>

  <h2>Dataset Overview</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${rows.toLocaleString()}</div>
      <div class="stat-label">Total Rows</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${columns.length}</div>
      <div class="stat-label">Columns</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${numericCols.length}</div>
      <div class="stat-label">Numeric Columns</div>
    </div>
  </div>

  <h2>Columns</h2>
  <div class="columns-grid">
    ${columns.map(col => `
      <div class="col-badge">
        <span>${col}</span>
        <span class="col-type ${columnTypes[col]}">${columnTypes[col]}</span>
      </div>
    `).join("")}
  </div>

  <h2>AI Analysis Summary</h2>
  <div class="summary">${summary}</div>

  ${messages.length > 0 ? `
  <h2>Chat History</h2>
  <div class="chat-section">
    ${messages.map(m => `
      <div class="message ${m.role === "user" ? "user-msg" : "assistant-msg"}">
        <div class="msg-label ${m.role === "user" ? "user-label" : "assistant-label"}">
          ${m.role === "user" ? "You" : "AI Analyst"}
        </div>
        ${m.content}
      </div>
    `).join("")}
  </div>
  ` : ""}

  <footer>Generated by AI Data Dashboard · Data is private and auto-deleted after 24 hours</footer>
</body>
</html>`;

      // Open in new tab and trigger print
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
      }

    } catch (e) {
      console.error(e);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generateReport}
      disabled={loading}
      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 border border-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          Generating...
        </>
      ) : (
        <>
          📄 Export Report
        </>
      )}
    </button>
  );
}

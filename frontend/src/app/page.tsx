"use client";

import { useState, useEffect } from "react";
import UploadZone from "@/components/UploadZone";
import DataTable from "@/components/DataTable";
import StatsBar from "@/components/StatsBar";
import SmartCharts from "@/components/SmartCharts";
import ChartBuilder from "@/components/ChartBuilder";
import AskAI from "@/components/AskAI";
import ExportReport from "@/components/ExportReport";

export interface DatasetInfo {
  dataset_id: string;
  filename: string;
  rows: number;
  columns: string[];
  column_types: Record<string, "numeric" | "categorical" | "datetime">;
  preview: Record<string, any>[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

type Tab = "overview" | "charts" | "build" | "ask";

export default function Home() {
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedDataset = localStorage.getItem("ai_dashboard_dataset");
      const savedMessages = localStorage.getItem("ai_dashboard_messages");
      const savedTab = localStorage.getItem("ai_dashboard_tab");
      if (savedDataset) setDataset(JSON.parse(savedDataset));
      if (savedMessages) setMessages(JSON.parse(savedMessages));
      if (savedTab) setActiveTab(savedTab as Tab);
    } catch (e) {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (dataset) localStorage.setItem("ai_dashboard_dataset", JSON.stringify(dataset));
    else localStorage.removeItem("ai_dashboard_dataset");
  }, [dataset, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("ai_dashboard_messages", JSON.stringify(messages));
  }, [messages, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("ai_dashboard_tab", activeTab);
  }, [activeTab, hydrated]);

  const handleNewUpload = (data: DatasetInfo) => {
    setDataset(data);
    setMessages([]);
    setActiveTab("overview");
  };

  const handleReset = () => {
    setDataset(null);
    setMessages([]);
    setActiveTab("overview");
    localStorage.removeItem("ai_dashboard_dataset");
    localStorage.removeItem("ai_dashboard_messages");
    localStorage.removeItem("ai_dashboard_tab");
  };

  if (!hydrated) return null;

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "overview", label: "Overview",      emoji: "📋" },
    { id: "charts",   label: "AI Charts",     emoji: "✨" },
    { id: "build",    label: "Chart Builder", emoji: "🛠️" },
    { id: "ask",      label: "Ask AI",        emoji: "🤖" },
  ];

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">AI Data Dashboard</h1>
        <p className="text-gray-400 mt-2">Upload any CSV file to explore and analyze your data with AI.</p>
      </div>

      {!dataset ? (
        <UploadZone onUpload={handleNewUpload} />
      ) : (
        <div className="space-y-6">
          {/* File info bar */}
          <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
            <div>
              <p className="text-sm text-gray-400">Loaded file</p>
              <p className="font-semibold text-white">{dataset.filename}</p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-400">{dataset.rows.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Rows</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-400">{dataset.columns.length}</p>
                <p className="text-xs text-gray-500">Columns</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ExportReport
                datasetId={dataset.dataset_id}
                filename={dataset.filename}
                rows={dataset.rows}
                columns={dataset.columns}
                columnTypes={dataset.column_types}
                messages={messages}
              />
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg transition"
              >
                Upload new file
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === tab.id ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-6">
              <StatsBar dataset={dataset} />
              <DataTable dataset={dataset} />
            </div>
          )}

          {activeTab === "charts" && (
            <SmartCharts datasetId={dataset.dataset_id} />
          )}

          {activeTab === "build" && (
            <ChartBuilder
              datasetId={dataset.dataset_id}
              columns={dataset.columns}
              columnTypes={dataset.column_types}
            />
          )}

          <div className={activeTab === "ask" ? "block" : "hidden"}>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <AskAI
                datasetId={dataset.dataset_id}
                messages={messages}
                setMessages={setMessages}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

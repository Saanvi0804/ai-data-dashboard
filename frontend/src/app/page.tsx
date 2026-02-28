"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import UploadZone from "@/components/UploadZone";
import DataTable from "@/components/DataTable";
import StatsBar from "@/components/StatsBar";
import StatsCards from "@/components/StatsCards";
import Charts from "@/components/Charts";
import AskAI from "@/components/AskAI";

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

type Tab = "overview" | "charts" | "stats" | "ask";

export default function Home() {
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on first render
  useEffect(() => {
    try {
      const savedDataset = localStorage.getItem("ai_dashboard_dataset");
      const savedMessages = localStorage.getItem("ai_dashboard_messages");
      const savedTab = localStorage.getItem("ai_dashboard_tab");

      if (savedDataset) setDataset(JSON.parse(savedDataset));
      if (savedMessages) setMessages(JSON.parse(savedMessages));
      if (savedTab) setActiveTab(savedTab as Tab);
    } catch (e) {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Save dataset to localStorage whenever it changes
  useEffect(() => {
    if (!hydrated) return;
    if (dataset) {
      localStorage.setItem("ai_dashboard_dataset", JSON.stringify(dataset));
    } else {
      localStorage.removeItem("ai_dashboard_dataset");
    }
  }, [dataset, hydrated]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("ai_dashboard_messages", JSON.stringify(messages));
  }, [messages, hydrated]);

  // Save active tab
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("ai_dashboard_tab", activeTab);
  }, [activeTab, hydrated]);

  // Fetch stats when dataset is loaded
  useEffect(() => {
    if (!dataset) return;
    setLoadingStats(true);
    axios
      .get(`https://ai-data-dashboard.onrender.com/api/stats/${dataset.dataset_id}`)
      .then((res) => setStatsData(res.data))
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }, [dataset]);

  const handleNewUpload = (data: DatasetInfo) => {
    setDataset(data);
    setMessages([]);
    setStatsData(null);
    setActiveTab("overview");
  };

  const handleReset = () => {
    setDataset(null);
    setStatsData(null);
    setMessages([]);
    setActiveTab("overview");
    localStorage.removeItem("ai_dashboard_dataset");
    localStorage.removeItem("ai_dashboard_messages");
    localStorage.removeItem("ai_dashboard_tab");
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "overview", label: "Overview",     emoji: "📋" },
    { id: "charts",   label: "Charts",       emoji: "📊" },
    { id: "stats",    label: "Column Stats", emoji: "🔢" },
    { id: "ask",      label: "Ask AI",       emoji: "🤖" },
  ];

  // Prevent hydration mismatch
  if (!hydrated) return null;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">AI Data Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Upload any CSV file to explore and analyze your data with AI.
        </p>
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
            <button
              onClick={handleReset}
              className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg transition"
            >
              Upload new file
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <StatsBar dataset={dataset} />
              <DataTable dataset={dataset} />
            </div>
          )}

          {activeTab === "charts" && (
            <div>
              {loadingStats ? (
                <div className="flex items-center gap-3 text-gray-400 py-10">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  Loading charts...
                </div>
              ) : statsData?.charts ? (
                <Charts charts={statsData.charts} />
              ) : (
                <p className="text-gray-500">No chart data available.</p>
              )}
            </div>
          )}

          {activeTab === "stats" && (
            <div>
              {loadingStats ? (
                <div className="flex items-center gap-3 text-gray-400 py-10">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  Loading stats...
                </div>
              ) : statsData?.stats ? (
                <StatsCards stats={statsData.stats} />
              ) : (
                <p className="text-gray-500">No stats available.</p>
              )}
            </div>
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

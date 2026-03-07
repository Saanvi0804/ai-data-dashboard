"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/AuthForm";
import UploadZone from "@/components/UploadZone";
import StatsBar from "@/components/StatsBar";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import SmartCharts from "@/components/SmartCharts";
import ChartBuilder from "@/components/ChartBuilder";
import ExportReport from "@/components/ExportReport";
import AskAI from "@/components/AskAI";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface DatasetInfo {
  id: string;
  filename: string;
  rows: number;
  columns: string[];
  column_types: Record<string, "numeric" | "categorical" | "datetime">;
  preview: any[];
  stats: any;
  summary?: string;
}

export default function Home() {
  const { token, logout } = useAuth();
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("current_dataset");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) setDataset(parsed);
      } catch (e) {
        localStorage.removeItem("current_dataset");
      }
    }
  }, []);

  const handleNewUpload = (data: DatasetInfo) => {
    setDataset(data);
    localStorage.setItem("current_dataset", JSON.stringify(data));
    setActiveTab("overview");
    setMessages([]);
  };

  if (!token) return <AuthForm />;

  return (
    <main className="min-h-screen bg-[#030712] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">AI Data Dashboard</h1>
          <button onClick={logout} className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm hover:bg-gray-800 transition">
            Logout
          </button>
        </div>

        {!dataset ? (
          <UploadZone onUpload={handleNewUpload} />
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Loaded file</p>
                <p className="text-lg font-semibold text-indigo-400">{dataset.filename}</p>
              </div>
              <div className="flex gap-12">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{dataset.rows?.toLocaleString() ?? 0}</p>
                  <p className="text-xs text-gray-500 uppercase">Rows</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{dataset.columns?.length ?? 0}</p>
                  <p className="text-xs text-gray-500 uppercase">Columns</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ExportReport 
                  datasetId={dataset.id} 
                  filename={dataset.filename} 
                  rows={dataset.rows} 
                  columns={dataset.columns} 
                  columnTypes={dataset.column_types} 
                  messages={messages} 
                />
                <button onClick={() => { localStorage.removeItem("current_dataset"); setDataset(null); }} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
                  Upload new file
                </button>
              </div>
            </div>
            {dataset.summary && (
              <div className="bg-indigo-950/30 border border-indigo-800 rounded-xl p-4 flex gap-3 items-start">
                <div className="text-xl">🤖</div>
                <div>
                  <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">
                    AI Dataset Insight
                  </p>
                  <p className="text-sm text-indigo-200">
                    {dataset.summary}
                  </p>
                </div>
              </div>
            )}
            <div className="flex p-1 bg-gray-900 border border-gray-800 rounded-xl w-fit">
              {["overview", "charts", "builder", "ask"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab === "ask" ? "Ask AI" : tab === "charts" ? "AI Charts" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === "overview" && dataset && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StatsBar dataset={dataset} />
                <StatsCards stats={dataset.stats} />
                <DataTable dataset={dataset} />
              </div>
            )}

            {activeTab === "charts" && dataset && <SmartCharts datasetId={dataset.id} />}
            
            {activeTab === "builder" && dataset && (
              <ChartBuilder 
                datasetId={dataset.id} 
                columns={dataset.columns} 
                columnTypes={dataset.column_types} 
              />
            )}

            {activeTab === "ask" && dataset && (
              <AskAI 
                datasetId={dataset.id} 
                messages={messages} 
                setMessages={setMessages} 
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
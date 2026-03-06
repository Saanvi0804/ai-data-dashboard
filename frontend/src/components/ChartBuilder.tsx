"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const API = "https://ai-data-dashboard.onrender.com";
const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

interface Props {
  datasetId: string;
  columns: string[];
  columnTypes: Record<string, "numeric" | "categorical" | "datetime">;
}

export default function ChartBuilder({ datasetId, columns, columnTypes }: Props) {
  const { token } = useAuth();
  const [xCol, setXCol] = useState(columns?.[0] || "");
  const [yCol, setYCol] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [aggregation, setAggregation] = useState("sum");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  // Update selections when a new file is uploaded to prevent 'undefined' property errors
  useEffect(() => {
    if (columns?.length > 0) {
      setXCol(columns[0]);
      const numeric = columns.find(c => columnTypes?.[c] === "numeric");
      setYCol(numeric || columns[1] || columns[0]);
      setGenerated(false);
      setChartData([]);
    }
  }, [datasetId, columns, columnTypes]);

  const generate = async () => {
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/custom-chart`, {
        dataset_id: datasetId,
        x: xCol,
        y: chartType === "histogram" ? null : yCol,
        chart_type: chartType,
        aggregation: chartType === "scatter" ? "none" : aggregation,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Fix: Ensure we always have an array even if the backend returns null
      setChartData(res.data?.data ?? []);
      setGenerated(true);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to generate chart.");
    } finally {
      setLoading(false);
    }
  };

  const axisStyle = { fill: "#9ca3af", fontSize: 11 };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
      {/* Controls Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs text-gray-400 uppercase mb-1.5 block">Chart Type</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white outline-none">
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="scatter">Scatter Plot</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase mb-1.5 block">X Axis</label>
          <select value={xCol} onChange={(e) => setXCol(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white outline-none">
            {columns?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {chartType !== "histogram" && (
          <div>
            <label className="text-xs text-gray-400 uppercase mb-1.5 block">Y Axis</label>
            <select value={yCol} onChange={(e) => setYCol(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white outline-none">
              {columns?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-medium px-6 py-2.5 rounded-xl transition text-sm"
      >
        {loading ? "Generating..." : "Generate Chart"}
      </button>

      {/* FIXED: Conditional rendering for ResponsiveContainer */}
      {generated && (
        <div className="h-[400px] mt-8 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
           {chartData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="label" tick={axisStyle} />
                    <YAxis tick={axisStyle} />
                    <Tooltip contentStyle={{backgroundColor: '#111827', border: '1px solid #374151'}} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="label" tick={axisStyle} />
                    <YAxis tick={axisStyle} />
                    <Tooltip contentStyle={{backgroundColor: '#111827', border: '1px solid #374151'}} />
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} />
                  </LineChart>
                )}
             </ResponsiveContainer>
           ) : (
             <div className="flex items-center justify-center h-full text-gray-500 italic">
               No data found for selected columns.
             </div>
           )}
        </div>
      )}
    </div>
  );
}
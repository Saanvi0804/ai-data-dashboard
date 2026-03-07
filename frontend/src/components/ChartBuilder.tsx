"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { PieChart, Pie, Cell } from "recharts";

const API = "https://ai-data-dashboard.onrender.com";

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
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (columns?.length > 0) {
      setXCol(columns[0]);
      const numeric = columns.find(c => columnTypes?.[c] === "numeric");
      setYCol(numeric || columns[1] || columns[0]);
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
        aggregation: "sum",
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChartData(res.data?.data ?? []);
      setGenerated(true);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to generate chart.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white">
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="pie">Pie Chart</option>
        </select>
        <select value={xCol} onChange={(e) => setXCol(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white">
          {columns?.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={yCol} onChange={(e) => setYCol(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white">
          {columns?.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <button 
        onClick={generate} 
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 py-2.5 rounded-xl font-medium transition"
      >
        {loading ? "Generating..." : "Generate Chart"}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {generated && (
        <div className="h-[400px] mt-8 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
           {chartData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" && (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              )}

              {chartType === "line" && (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }} />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              )}

              {chartType === "pie" && (
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="label"
                    outerRadius={120}
                    fill="#6366f1"
                    label
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b"][i % 5]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
             </ResponsiveContainer>
           ) : (
             <div className="flex items-center justify-center h-full text-gray-500">No data for selected columns</div>
           )}
        </div>
      )}
    </div>
  );
}
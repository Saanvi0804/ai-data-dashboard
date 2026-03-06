"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

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
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/custom-chart`, {
        dataset_id: datasetId,
        x: xCol,
        y: yCol,
        chart_type: chartType,
        aggregation: "sum",
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChartData(res.data?.data ?? []);
      setGenerated(true);
    } catch {
      setGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="bg-gray-800 p-2 rounded-lg text-sm">
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
        </select>
        <select value={xCol} onChange={(e) => setXCol(e.target.value)} className="bg-gray-800 p-2 rounded-lg text-sm">
          {columns?.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={yCol} onChange={(e) => setYCol(e.target.value)} className="bg-gray-800 p-2 rounded-lg text-sm">
          {columns?.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <button onClick={generate} className="bg-indigo-600 px-6 py-2 rounded-xl text-sm">{loading ? "..." : "Generate"}</button>

      {generated && chartData.length > 0 && (
        <div className="h-[400px] mt-8 bg-black/20 p-4 rounded-xl">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{backgroundColor: '#111827'}} />
                <Bar dataKey="value" fill="#6366f1" />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{backgroundColor: '#111827'}} />
                <Line type="monotone" dataKey="value" stroke="#6366f1" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
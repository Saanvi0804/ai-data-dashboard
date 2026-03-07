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

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#f97316"
];

interface ChartSuggestion {
  title: string;
  type: "bar" | "line" | "pie" | "scatter" | "histogram";
  x: string;
  y: string | null;
  description: string;
  data: any[];
}

interface Props {
  datasetId: string;
}

export default function SmartCharts({ datasetId }: Props) {

  const { token } = useAuth();

  const [charts, setCharts] = useState<ChartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    if (!datasetId || !token) return;

    setLoading(true);
    setError("");

    axios.post(
      `${API}/api/suggest-charts`,
      { dataset_id: datasetId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then((res) => {
      setCharts(res.data?.charts ?? []);
    })
    .catch((err) => {
      const msg =
        err?.response?.status === 401
          ? "Session expired. Please log in again."
          : "Failed to generate charts.";
      setError(msg);
    })
    .finally(() => setLoading(false));

  }, [datasetId, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">AI is analyzing your data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  const validCharts = charts.filter((chart) => {

    if (!chart?.data || chart.data.length === 0) return false;

    if (chart.type === "scatter") {
      return chart.data.some(p => p.x !== undefined && p.y !== undefined);
    }

    return true;

  });

  if (validCharts.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No useful charts could be generated for this dataset.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {validCharts.map((chart, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">

          <h3 className="text-white font-semibold mb-1">
            {chart.title}
          </h3>

          <p className="text-gray-500 text-xs mb-4">
            {chart.description}
          </p>

          <RenderChart chart={chart} colors={COLORS} />

        </div>
      ))}

    </div>
  );
}

function RenderChart({ chart, colors }: { chart: ChartSuggestion; colors: string[] }) {

  const data = chart?.data ?? [];
  const type = chart?.type;

  const axisStyle = { fill: "#9ca3af", fontSize: 11 };
  const tooltipStyle = {
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: 8
  };

  if (type === "bar" || type === "histogram") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="label" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" fill={colors[0]} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="label" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="x" tick={axisStyle} />
          <YAxis dataKey="y" tick={axisStyle} />
          <Tooltip contentStyle={tooltipStyle} />
          <Scatter data={data} fill={colors[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
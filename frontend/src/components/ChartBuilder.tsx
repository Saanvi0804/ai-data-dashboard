"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext"; // Fix: Import useAuth
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

const CHART_TYPES = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "scatter", label: "Scatter Plot" },
  { value: "histogram", label: "Histogram" },
];

const AGGREGATIONS = [
  { value: "sum", label: "Sum" },
  { value: "mean", label: "Average" },
  { value: "count", label: "Count" },
];

export default function ChartBuilder({ datasetId, columns, columnTypes }: Props) {
  const { token } = useAuth(); // Fix: Get security token
  const [xCol, setXCol] = useState(columns[0] || "");
  const [yCol, setYCol] = useState(columns.find(c => columnTypes[c] === "numeric") || "");
  const [chartType, setChartType] = useState("bar");
  const [aggregation, setAggregation] = useState("sum");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  const needsY = chartType !== "histogram";

  const generate = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/custom-chart`, {
        dataset_id: datasetId,
        x: xCol,
        y: needsY ? yCol : null,
        chart_type: chartType,
        aggregation: chartType === "scatter" ? "none" : aggregation,
      }, {
        headers: { Authorization: `Bearer ${token}` } // Fix: Send Auth header
      });
      
      // Fix: Add null-safety to response data
      setChartData(res.data?.data ?? []);
      setGenerated(true);
    } catch (e: any) {
      const msg = e?.response?.status === 401 
        ? "Session expired. Please log in again." 
        : (e?.response?.data?.detail || "Failed to generate chart.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const tooltipStyle = { backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 };
  const axisStyle = { fill: "#9ca3af", fontSize: 11 };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-white font-semibold text-lg mb-1">Custom Chart Builder</h3>
        <p className="text-gray-400 text-sm">Pick any columns and chart type to visualize your data.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Chart Type</label>
          <select
            value={chartType}
            onChange={(e) => { setChartType(e.target.value); setGenerated(false); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
          >
            {CHART_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">
            {chartType === "scatter" ? "X Axis" : chartType === "histogram" ? "Column" : "X Axis (Category)"}
          </label>
          <select
            value={xCol}
            onChange={(e) => { setXCol(e.target.value); setGenerated(false); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
          >
            {columns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {needsY && (
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">
              {chartType === "scatter" ? "Y Axis" : "Y Axis (Value)"}
            </label>
            <select
              value={yCol}
              onChange={(e) => { setYCol(e.target.value); setGenerated(false); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
            >
              {columns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {chartType !== "scatter" && chartType !== "histogram" && (
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Aggregation</label>
            <select
              value={aggregation}
              onChange={(e) => { setAggregation(e.target.value); setGenerated(false); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
            >
              {AGGREGATIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium px-6 py-2.5 rounded-xl transition text-sm"
      >
        {loading ? "Generating..." : "Generate Chart"}
      </button>

      {error && (
        <p className="text-red-400 text-sm bg-red-950/30 border border-red-800 px-4 py-2 rounded-lg">{error}</p>
      )}

      {generated && chartData?.length > 0 && (
        <div className="pt-2">
          <ResponsiveContainer width="100%" height={280}>
            {chartType === "bar" || chartType === "histogram" ? (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={axisStyle} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={axisStyle} width={60} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={axisStyle} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={axisStyle} width={60} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} dot={false} />
              </LineChart>
            ) : chartType === "pie" ? (
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100}
                  label={(props) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {chartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            ) : (
              <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="x" name={xCol} tick={axisStyle} />
                <YAxis dataKey="y" name={yCol} tick={axisStyle} width={60} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={chartData} fill={COLORS[0]} />
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
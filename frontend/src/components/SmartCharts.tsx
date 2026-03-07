"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import html2canvas from "html2canvas";

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
  insight?: string;
}

interface Props {
  datasetId: string;
}

export default function SmartCharts({ datasetId }: Props) {

  const { token } = useAuth();

  const [charts, setCharts] = useState<ChartSuggestion[]>([]);
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");

  const [loading, setLoading] = useState(true);
  const [promptLoading, setPromptLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {

    if (!datasetId || !token) return;

    setLoading(true);

    Promise.all([

      axios.post(
        `${API}/api/suggest-charts`,
        { dataset_id: datasetId },
        { headers: { Authorization: `Bearer ${token}` } }
      ),

      axios.post(
        `${API}/api/correlations`,
        { dataset_id: datasetId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

    ])
    .then(([chartsRes, corrRes]) => {

      setCharts(chartsRes.data?.charts ?? []);
      setCorrelations(corrRes.data?.correlations ?? []);

    })
    .catch(() => setError("Failed to generate charts."))
    .finally(() => setLoading(false));

  }, [datasetId, token]);



  const generateChartFromPrompt = async () => {

    if (!prompt.trim()) return;

    setPromptLoading(true);

    try {

      const res = await axios.post(
        `${API}/api/generate-chart-from-prompt`,
        {
          dataset_id: datasetId,
          prompt
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.chart) {
        setCharts(prev => [res.data.chart, ...prev]);
      }

      setPrompt("");

    } catch {
      alert("AI could not generate a chart from that prompt.");
    }

    setPromptLoading(false);

  };



  const downloadChart = async (id: string) => {

    const el = document.getElementById(id);
    if (!el) return;

    const canvas = await html2canvas(el);

    const link = document.createElement("a");
    link.download = "chart.png";
    link.href = canvas.toDataURL();
    link.click();

  };



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
        {error}
      </div>
    );
  }



  const validCharts = charts.filter(c => c?.data && c.data.length > 0);



  return (
    <div className="space-y-8">

      {/* Prompt Chart Generator */}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">

        <p className="text-sm text-indigo-400 font-semibold">
          Generate chart using AI
        </p>

        <div className="flex gap-3">

          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: show average score by subject"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white"
          />

          <button
            onClick={generateChartFromPrompt}
            disabled={promptLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium"
          >
            {promptLoading ? "Generating..." : "Generate"}
          </button>

        </div>

      </div>



      {/* Correlation Charts */}

      {correlations.length > 0 && (

        <div className="space-y-4">

          <h2 className="text-lg font-semibold text-indigo-400">
            Strong Relationships Detected
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {correlations.map((c, i) => (

              <div key={i} id={`corr-${i}`} className="bg-gray-900 border border-gray-800 rounded-xl p-5">

                <button
                  onClick={() => downloadChart(`corr-${i}`)}
                  className="text-xs text-indigo-400 mb-2"
                >
                  Download PNG
                </button>

                <h3 className="text-white font-semibold">
                  {c.title}
                </h3>

                <p className="text-xs text-gray-400 mb-3">
                  Correlation: {c.correlation}
                </p>

                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="x" />
                    <YAxis dataKey="y" />
                    <Tooltip />
                    <Scatter data={c.data} fill="#6366f1" />
                  </ScatterChart>
                </ResponsiveContainer>

              </div>

            ))}

          </div>

        </div>

      )}



      {/* AI Charts */}

      {validCharts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No useful charts could be generated.
        </div>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {validCharts.map((chart, i) => (

            <div key={i} id={`chart-${i}`} className="bg-gray-900 border border-gray-800 rounded-xl p-5">

              <button
                onClick={() => downloadChart(`chart-${i}`)}
                className="text-xs text-indigo-400 mb-2"
              >
                Download PNG
              </button>

              <h3 className="text-white font-semibold mb-1">
                {chart.title}
              </h3>

              <p className="text-gray-500 text-xs mb-4">
                {chart.description}
              </p>

              <RenderChart chart={chart} colors={COLORS} />

              {chart.insight && (
                <div className="mt-4 text-sm text-indigo-300 bg-indigo-950/40 border border-indigo-900 rounded-lg px-3 py-2">
                  <span className="font-semibold">Insight:</span> {chart.insight}
                </div>
              )}

            </div>

          ))}

        </div>

      )}

    </div>
  );
}



function RenderChart({ chart, colors }: { chart: ChartSuggestion; colors: string[] }) {

  const data = chart.data;

  const axisStyle = { fill: "#9ca3af", fontSize: 11 };

  if (chart.type === "bar" || chart.type === "histogram") {

    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="label" tick={axisStyle}/>
          <YAxis tick={axisStyle}/>
          <Tooltip/>
          <Bar dataKey="value" fill={colors[0]} />
        </BarChart>
      </ResponsiveContainer>
    );

  }

  if (chart.type === "line") {

    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
          <XAxis dataKey="label" tick={axisStyle}/>
          <YAxis tick={axisStyle}/>
          <Tooltip/>
          <Line type="monotone" dataKey="value" stroke={colors[0]}/>
        </LineChart>
      </ResponsiveContainer>
    );

  }

  if (chart.type === "pie") {

    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" outerRadius={80}>
            {data.map((_: any, i: number) =>
              <Cell key={i} fill={colors[i % colors.length]} />
            )}
          </Pie>
          <Tooltip/>
        </PieChart>
      </ResponsiveContainer>
    );

  }

  if (chart.type === "scatter") {

    return (
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
          <XAxis dataKey="x"/>
          <YAxis dataKey="y"/>
          <Tooltip/>
          <Scatter data={data} fill={colors[0]}/>
        </ScatterChart>
      </ResponsiveContainer>
    );

  }

  return null;
}
"use client";

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";

interface Props {
  charts: {
    revenue_over_time?: { date: string; revenue: number }[];
    top_products?: { product: string; revenue: number }[];
    revenue_by_category?: { category: string; revenue: number }[];
    revenue_by_region?: { region: string; revenue: number }[];
  };
}

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const chartCardClass = "bg-gray-900 border border-gray-800 rounded-xl p-5";

export default function Charts({ charts }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Charts & Visualizations
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue Over Time */}
        {charts.revenue_over_time && charts.revenue_over_time.length > 0 && (
          <div className={chartCardClass}>
            <p className="text-sm font-semibold text-white mb-4">Revenue Over Time</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={charts.revenue_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  tickFormatter={(v) => v.slice(5)} // show MM-DD
                />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                  labelStyle={{ color: "#e5e7eb" }}
                  itemStyle={{ color: "#818cf8" }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: "#6366f1", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Products by Revenue */}
        {charts.top_products && charts.top_products.length > 0 && (
          <div className={chartCardClass}>
            <p className="text-sm font-semibold text-white mb-4">Top Products by Revenue</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.top_products} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="product"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                  itemStyle={{ color: "#818cf8" }}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Category */}
        {charts.revenue_by_category && charts.revenue_by_category.length > 0 && (
          <div className={chartCardClass}>
            <p className="text-sm font-semibold text-white mb-4">Revenue by Category</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={charts.revenue_by_category}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category, percent }) =>
                    `${category} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {charts.revenue_by_category.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                  itemStyle={{ color: "#e5e7eb" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Region */}
        {charts.revenue_by_region && charts.revenue_by_region.length > 0 && (
          <div className={chartCardClass}>
            <p className="text-sm font-semibold text-white mb-4">Revenue by Region</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.revenue_by_region}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="region" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                  itemStyle={{ color: "#06b6d4" }}
                />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  );
}

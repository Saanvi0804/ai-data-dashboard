"use client";

import { DatasetInfo } from "@/app/page";

interface Props {
  dataset: DatasetInfo;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  numeric:     { bg: "bg-blue-950/60",   text: "text-blue-300",   label: "Numeric" },
  categorical: { bg: "bg-purple-950/60", text: "text-purple-300", label: "Categorical" },
  datetime:    { bg: "bg-green-950/60",  text: "text-green-300",  label: "Datetime" },
};

export default function StatsBar({ dataset }: Props) {
  const { columns, column_types } = dataset;

  const counts = {
    numeric:     columns.filter((c) => column_types[c] === "numeric").length,
    categorical: columns.filter((c) => column_types[c] === "categorical").length,
    datetime:    columns.filter((c) => column_types[c] === "datetime").length,
  };

  return (
    <div className="space-y-3">
      {/* Type summary */}
      <div className="flex gap-3">
        {Object.entries(counts).map(([type, count]) => {
          if (count === 0) return null;
          const style = TYPE_STYLES[type];
          return (
            <div key={type} className={`${style.bg} border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2`}>
              <span className={`text-lg font-bold ${style.text}`}>{count}</span>
              <span className="text-xs text-gray-400">{style.label} columns</span>
            </div>
          );
        })}
      </div>

      {/* Column tags */}
      <div className="flex flex-wrap gap-2">
        {columns.map((col) => {
          const type = column_types[col] || "categorical";
          const style = TYPE_STYLES[type];
          return (
            <span
              key={col}
              className={`${style.bg} ${style.text} text-xs px-2.5 py-1 rounded-md border border-gray-800`}
            >
              {col}
            </span>
          );
        })}
      </div>
    </div>
  );
}

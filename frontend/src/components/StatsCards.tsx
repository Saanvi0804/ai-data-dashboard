"use client";

interface ColumnStat {
  type: "numeric" | "categorical";
  null_count: number;
  unique_count: number;
  mean?: number;
  min?: number;
  max?: number;
  sum?: number;
  top_values?: { value: string; count: number }[];
}

interface Props {
  stats: Record<string, ColumnStat>;
}

export default function StatsCards({ stats }: Props) {
  const numericCols = Object.entries(stats).filter(([, s]) => s.type === "numeric");
  const categoricalCols = Object.entries(stats).filter(([, s]) => s.type === "categorical");

  return (
    <div className="space-y-6">
      {/* Numeric column stats */}
      {numericCols.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Numeric Columns
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {numericCols.map(([col, s]) => (
              <div key={col} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide truncate">{col}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800/60 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Mean</p>
                    <p className="text-sm font-bold text-blue-300">{s.mean?.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Sum</p>
                    <p className="text-sm font-bold text-indigo-300">{s.sum?.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Min</p>
                    <p className="text-sm font-bold text-green-300">{s.min?.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Max</p>
                    <p className="text-sm font-bold text-orange-300">{s.max?.toLocaleString()}</p>
                  </div>
                </div>
                {s.null_count > 0 && (
                  <p className="text-xs text-red-400">{s.null_count} null values</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorical column stats */}
      {categoricalCols.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Categorical Columns
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoricalCols.map(([col, s]) => (
              <div key={col} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{col}</p>
                  <span className="text-xs text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded-full">
                    {s.unique_count} unique
                  </span>
                </div>
                <div className="space-y-1.5">
                  {s.top_values?.map((tv) => (
                    <div key={tv.value} className="flex justify-between items-center">
                      <span className="text-xs text-gray-300 truncate max-w-[140px]">{tv.value}</span>
                      <span className="text-xs text-gray-500 ml-2">{tv.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

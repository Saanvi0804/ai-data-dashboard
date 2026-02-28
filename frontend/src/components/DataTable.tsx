"use client";

import { DatasetInfo } from "@/app/page";

interface Props {
  dataset: DatasetInfo;
}

export default function DataTable({ dataset }: Props) {
  const { columns, preview } = dataset;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="font-semibold text-white">Data Preview</h2>
        <p className="text-xs text-gray-500 mt-0.5">Showing first 5 rows</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/60">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr
                key={i}
                className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-3 text-gray-300 whitespace-nowrap max-w-[200px] truncate"
                    title={String(row[col])}
                  >
                    {row[col] === "" || row[col] === null || row[col] === undefined
                      ? <span className="text-gray-600 italic">null</span>
                      : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

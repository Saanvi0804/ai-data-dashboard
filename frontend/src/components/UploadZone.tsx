"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { DatasetInfo } from "@/app/page";

interface Props {
  onUpload: (data: DatasetInfo) => void;
}

export default function UploadZone({ onUpload }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpload({ ...res.data, filename: file.name });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Upload failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          w-full max-w-xl border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all
          ${dragging
            ? "border-indigo-500 bg-indigo-950/30"
            : "border-gray-700 hover:border-gray-500 bg-gray-900/50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {loading ? (
          <div className="space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400">Parsing your CSV...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-5xl">📊</div>
            <p className="text-xl font-semibold text-white">Drop your CSV here</p>
            <p className="text-gray-400 text-sm">or click to browse files</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-red-400 text-sm bg-red-950/30 border border-red-800 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <p className="mt-6 text-xs text-gray-600">
        Supported format: .csv — Any size dataset works
      </p>
    </div>
  );
}

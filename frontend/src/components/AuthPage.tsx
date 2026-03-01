"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📊</div>
          <h1 className="text-3xl font-bold text-white">AI Data Dashboard</h1>
          <p className="text-gray-400 mt-2">Upload any CSV and analyze it with AI</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {/* Tab switcher */}
          <div className="flex gap-1 bg-gray-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "login" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "register" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="you@example.com"
                className="w-full mt-1.5 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition placeholder-gray-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                className="w-full mt-1.5 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition placeholder-gray-600"
              />
              {mode === "register" && (
                <p className="text-xs text-gray-600 mt-1">Minimum 6 characters</p>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/30 border border-red-800 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!email || !password || loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-xl transition mt-2"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Your data is private and automatically deleted after 24 hours.
        </p>
      </div>
    </div>
  );
}

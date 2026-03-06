"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) await login(email, password);
      else await register(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {isLogin ? "Welcome Back" : "Create Account"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-indigo-500"
          required 
        />
        <input 
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-indigo-500"
          required 
        />
        <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-semibold transition">
          {isLogin ? "Login" : "Register"}
        </button>
      </form>
      {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
      <button 
        onClick={() => setIsLogin(!isLogin)}
        className="w-full text-gray-400 text-sm mt-6 hover:text-white transition"
      >
        {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/app/page";

const API = "https://ai-data-dashboard.onrender.com";

interface Props {
  datasetId: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const SUGGESTED_QUESTIONS = [
  "What are the most important patterns in this dataset?",
  "Which columns have the highest values?",
  "Give me a summary of this dataset.",
  "What correlations exist between columns?",
];

export default function AskAI({ datasetId, messages, setMessages }: Props) {
  const { token } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading || !token) return;
    
    const userMsg: Message = { role: "user", content: question };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post(`${API}/api/query`, {
        dataset_id: datasetId,
        question,
        history: messages,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([...newMessages, { role: "assistant", content: res.data.answer }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "AI is unavailable. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] space-y-4">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="space-y-6 pt-4">
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Ask your Data AI</p>
              <p className="text-gray-400 text-sm">Select a question or type your own below.</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button 
                  key={q} 
                  onClick={() => sendMessage(q)}
                  className="text-left text-sm text-gray-300 bg-gray-800/60 hover:bg-gray-700 border border-gray-700 p-4 rounded-xl transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-800 border border-gray-700"
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && <div className="text-indigo-400 text-xs animate-pulse">AI is thinking...</div>}
        <div ref={bottomRef} />
      </div>
      
      <div className="flex gap-2 bg-gray-900 border border-gray-700 rounded-2xl p-2">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask a question..."
          className="flex-1 bg-transparent text-white px-3 py-2 outline-none"
        />
        <button 
          onClick={() => sendMessage(input)} 
          disabled={!input.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 px-6 py-2 rounded-xl text-sm font-medium transition"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
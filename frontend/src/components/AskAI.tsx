"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
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
];

export default function AskAI({ datasetId, messages, setMessages }: Props) {
  const { token } = useAuth(); // Get token
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
        headers: { Authorization: `Bearer ${token}` } // Added Auth
      });
      setMessages([...newMessages, { role: "assistant", content: res.data.answer }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "AI is busy. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-gray-900/30 rounded-2xl p-4 border border-gray-800">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400">Ask the AI Analyst about patterns or summaries in your data.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-indigo-600" : "bg-gray-800 border border-gray-700"}`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input 
          type="text" value={input} 
          onChange={(e) => setInput(e.target.value)} 
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm"
          placeholder="Type your question..."
        />
        <button onClick={() => sendMessage(input)} className="bg-indigo-600 px-6 py-2 rounded-xl text-sm font-medium">Ask</button>
      </div>
    </div>
  );
}
"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Message } from "@/app/page";

interface Props {
  datasetId: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const SUGGESTED_QUESTIONS = [
  "Which product had the highest total revenue?",
  "What is the average revenue per transaction?",
  "Which region performed the best?",
  "What is the best selling category?",
  "What is the total revenue across all transactions?",
];

export default function AskAI({ datasetId, messages, setMessages }: Props) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: question };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post("https://ai-data-dashboard.onrender.com/api/query", {
        dataset_id: datasetId,
        question,
        history: messages,
      });
      setMessages([...newMessages, { role: "assistant", content: res.data.answer }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.length === 0 ? (
          <div className="space-y-5 pt-4">
            <div className="text-center">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-white font-semibold text-lg">Ask anything about your data</p>
              <p className="text-gray-400 text-sm mt-1">
                I have full context of your dataset and can answer questions instantly.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Suggested questions</p>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left text-sm text-gray-300 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 hover:border-gray-500 rounded-xl px-4 py-3 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-sm"
              }`}>
                {msg.role === "assistant" && (
                  <p className="text-xs text-indigo-400 font-medium mb-1">AI Analyst</p>
                )}
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <p className="text-xs text-indigo-400 font-medium mb-1">AI Analyst</p>
              <div className="flex gap-1.5 items-center h-4">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 bg-gray-900 border border-gray-700 rounded-2xl p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask a question about your data..."
          className="flex-1 bg-transparent text-white text-sm px-3 py-2 outline-none placeholder-gray-500"
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-5 py-2 rounded-xl transition"
        >
          Ask
        </button>
      </div>
    </div>
  );
}

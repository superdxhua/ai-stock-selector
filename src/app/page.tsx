"use client";

import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import StockList from "@/components/StockList";
import BullStockAnalysis from "@/components/BullStockAnalysis";
import TaskSchedulerMonitor from "@/components/TaskSchedulerMonitor";
import StockTrackingManager from "@/components/StockTrackingManager";
import ExperienceLibrary from "@/components/ExperienceLibrary";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "stocks" | "bull" | "scheduler" | "tracking" | "experience">("chat");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* 顶部导航 */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              📈 牛股选股智能体
            </h1>
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTab === "chat"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                💬 对话
              </button>
              <button
                onClick={() => setActiveTab("stocks")}
                className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTab === "stocks"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                📊 策略
              </button>
              <button
                onClick={() => setActiveTab("bull")}
                className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTab === "bull"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                🔥 复盘
              </button>
              <button
                onClick={() => setActiveTab("tracking")}
                className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTab === "tracking"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                👁️ 跟踪
              </button>
              <button
                onClick={() => setActiveTab("experience")}
                className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTab === "experience"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                💡 经验
              </button>
              <button
                onClick={() => setActiveTab("scheduler")}
                className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTab === "scheduler"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                ⏰ 任务
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === "chat" && <ChatInterface />}
        {activeTab === "stocks" && <StockList />}
        {activeTab === "bull" && <BullStockAnalysis />}
        {activeTab === "tracking" && <StockTrackingManager />}
        {activeTab === "experience" && <ExperienceLibrary />}
        {activeTab === "scheduler" && <TaskSchedulerMonitor />}
      </main>
    </div>
  );
}

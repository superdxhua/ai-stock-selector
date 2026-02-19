"use client";

import { useState, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import StockList from "@/components/StockList";
import BullStockAnalysis from "@/components/BullStockAnalysis";
import StockTrackingManager from "@/components/StockTrackingManager";
import ExperienceLibrary from "@/components/ExperienceLibrary";
import AutoTaskMonitor from "@/components/AutoTaskMonitor";
import TonghuashunStrategy from "@/components/TonghuashunStrategy";
import SubscriptionPage from "@/components/SubscriptionPage";
import AdminOrdersPage from "@/components/AdminOrdersPage";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "stocks" | "bull" | "scheduler" | "tracking" | "experience" | "tonghuashun" | "subscription" | "admin">("chat");
  const [isAdmin, setIsAdmin] = useState(false);

  // 加载用户角色
  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const response = await fetch("/api/user/info", {
        headers: {
          "x-user-id": "demo-user-id",
        },
      });
      const result = await response.json();
      if (result.success) {
        setIsAdmin(result.data.isAdmin);
      }
    } catch (error) {
      console.error("获取用户角色失败:", error);
    }
  };

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
              {isAdmin && (
                <button
                  onClick={() => setActiveTab("tonghuashun")}
                  className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                    activeTab === "tonghuashun"
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  🌸 同花顺
                </button>
              )}
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
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                🤖 自动任务
              </button>
              <button
                onClick={() => setActiveTab("subscription")}
                className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTab === "subscription"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                💎 订阅会员
              </button>
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTab === "admin"
                    ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                ⚙️ 订单管理
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === "chat" && <ChatInterface />}
        {activeTab === "stocks" && <StockList />}
        {activeTab === "tonghuashun" && <TonghuashunStrategy />}
        {activeTab === "bull" && <BullStockAnalysis />}
        {activeTab === "tracking" && <StockTrackingManager />}
        {activeTab === "experience" && <ExperienceLibrary />}
        {activeTab === "scheduler" && <AutoTaskMonitor />}
        {activeTab === "subscription" && <SubscriptionPage />}
        {activeTab === "admin" && <AdminOrdersPage />}
      </main>
    </div>
  );
}

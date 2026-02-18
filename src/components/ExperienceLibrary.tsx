"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, CheckCircle2, XCircle, Lightbulb, AlertTriangle, TrendingUp, TrendingDown, Target, Award, Sparkles, Zap, BookOpen, Brain, ArrowRight } from "lucide-react";

interface ExperienceSummary {
  id: number;
  trackingRecordId: number;
  summary: string;
  keyFeatures: string[];
  t1Gain?: number;
  t3Gain?: number;
  maxGain?: number;
  attribution: {
    trend?: number;
    volume?: number;
    technical?: number;
    pattern?: number;
  };
  tags: string[];
  isVerified: boolean;
  createdAt: string;
}

interface FailureReflection {
  id: number;
  trackingRecordId: number;
  reflection: string;
  failureReason: {
    type: string;
    description: string;
    factors: string[];
  };
  t1Gain?: number;
  t3Gain?: number;
  maxGain?: number;
  issues: string[];
  suggestions: string[];
  createdAt: string;
}

export default function ExperienceLibrary() {
  const [experiences, setExperiences] = useState<ExperienceSummary[]>([]);
  const [reflections, setReflections] = useState<FailureReflection[]>([]);
  const [activeTab, setActiveTab] = useState<"experience" | "failure">("experience");
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [expResponse, refResponse] = await Promise.all([
        fetch('/api/experience?type=experience&verified=false&limit=50'),
        fetch('/api/experience?type=failure&limit=50'),
      ]);

      const expData = await expResponse.json();
      const refData = await refResponse.json();

      if (expData.success) {
        setExperiences(expData.data || []);
      }

      if (refData.success) {
        setReflections(refData.data || []);
      }
    } catch (error) {
      console.error('获取经验库数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBatchEvaluate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evaluate' }),
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchData();
      }
    } catch (error) {
      console.error('批量评估失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatGain = (gain?: number): string => {
    if (gain === undefined || gain === null) return '-';
    return gain >= 0 ? `+${gain.toFixed(2)}%` : `${gain.toFixed(2)}%`;
  };

  const getGainBadgeColor = (gain?: number): string => {
    if (gain === undefined || gain === null) return 'bg-gray-100 text-gray-700';
    return gain >= 0
      ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300 font-semibold'
      : 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300 font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
          <div className="p-4 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-100 mb-1">成功经验</p>
                <p className="text-2xl font-bold">{experiences.length}</p>
              </div>
              <Award className="w-10 h-10 opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
          <div className="p-4 bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-100 mb-1">失败复盘</p>
                <p className="text-2xl font-bold">{reflections.length}</p>
              </div>
              <AlertTriangle className="w-10 h-10 opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
          <div className="p-4 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-100 mb-1">平均收益</p>
                <p className="text-2xl font-bold">
                  {experiences.length > 0
                    ? `+${(experiences.reduce((sum, exp) => sum + (exp.maxGain || 0), 0) / experiences.length).toFixed(2)}%`
                    : '-'}
                </p>
              </div>
              <Target className="w-10 h-10 opacity-20" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
          <div className="p-4 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-100 mb-1">总经验值</p>
                <p className="text-2xl font-bold">{experiences.length + reflections.length}</p>
              </div>
              <Brain className="w-10 h-10 opacity-20" />
            </div>
          </div>
        </Card>
      </div>

      {/* 控制面板 */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="relative overflow-hidden">
          {/* 顶部装饰条 */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 animate-gradient bg-[length:200%_100%]" />
          
          <div className="p-6 border-b bg-gradient-to-br from-amber-50/80 via-orange-50/80 to-red-50/80 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    投资经验库
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    积累成功经验和失败复盘，提升选股能力
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={fetchData}
                  disabled={isLoading}
                  variant="outline"
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      刷新中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      刷新
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleBatchEvaluate}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white shadow-lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  批量评估
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="p-6">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger value="experience" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-sm">
              <Award className="w-4 h-4 mr-2" />
              成功经验
            </TabsTrigger>
            <TabsTrigger value="failure" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              失败复盘
            </TabsTrigger>
          </TabsList>

          <TabsContent value="experience" className="mt-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RefreshCw className="w-12 h-12 animate-spin text-amber-500 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">正在加载成功经验...</p>
              </div>
            ) : experiences.length === 0 ? (
              <div className="text-center py-16">
                <Award className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">暂无成功经验</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  成功的跟踪会自动生成经验总结
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experiences.map((experience) => (
                  <Card
                    key={experience.id}
                    className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-slate-200 dark:border-slate-700"
                  >
                    <div className="relative overflow-hidden">
                      {/* 顶部装饰 */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
                      
                      <div className="p-5">
                        {/* 头部 */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                              <Award className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 dark:text-slate-100">成功经验</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(experience.createdAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                          {experience.isVerified && (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              已验证
                            </Badge>
                          )}
                        </div>

                        {/* 收益信息 */}
                        <div className="flex gap-2 mb-4">
                          <Badge className={`${getGainBadgeColor(experience.maxGain)} shadow-sm`}>
                            <Target className="w-3 h-3 mr-1" />
                            最高收益: {formatGain(experience.maxGain)}
                          </Badge>
                          {experience.t1Gain !== undefined && (
                            <Badge className={`${getGainBadgeColor(experience.t1Gain)} shadow-sm`}>
                              <ArrowRight className="w-3 h-3 mr-1" />
                              T+1: {formatGain(experience.t1Gain)}
                            </Badge>
                          )}
                          {experience.t3Gain !== undefined && (
                            <Badge className={`${getGainBadgeColor(experience.t3Gain)} shadow-sm`}>
                              <ArrowRight className="w-3 h-3 mr-1" />
                              T+3: {formatGain(experience.t3Gain)}
                            </Badge>
                          )}
                        </div>

                        {/* 总结 */}
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                          {experience.summary}
                        </p>

                        {/* 关键特征 */}
                        {experience.keyFeatures.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">关键特征:</p>
                            <div className="flex flex-wrap gap-1">
                              {experience.keyFeatures.map((feature, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm"
                                >
                                  <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="failure" className="mt-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RefreshCw className="w-12 h-12 animate-spin text-red-500 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">正在加载失败复盘...</p>
              </div>
            ) : reflections.length === 0 ? (
              <div className="text-center py-16">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">暂无失败复盘</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  失败的跟踪会自动生成复盘分析
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reflections.map((reflection) => (
                  <Card
                    key={reflection.id}
                    className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-slate-200 dark:border-slate-700"
                  >
                    <div className="relative overflow-hidden">
                      {/* 顶部装饰 */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />
                      
                      <div className="p-5">
                        {/* 头部 */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white shadow-md">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 dark:text-slate-100">失败复盘</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(reflection.createdAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 失败原因 */}
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                          <div className="flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                                {reflection.failureReason.type}
                              </p>
                              <p className="text-xs text-red-600 dark:text-red-500">
                                {reflection.failureReason.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 复盘总结 */}
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                          {reflection.reflection}
                        </p>

                        {/* 改进建议 */}
                        {reflection.suggestions.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              <Zap className="w-3 h-3 inline mr-1 text-amber-500" />
                              改进建议:
                            </p>
                            <div className="space-y-1">
                              {reflection.suggestions.map((suggestion, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                                >
                                  {index + 1}. {suggestion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

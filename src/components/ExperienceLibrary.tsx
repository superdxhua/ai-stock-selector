"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, CheckCircle2, XCircle, Lightbulb, AlertTriangle, TrendingUp, TrendingDown, Target, Award } from "lucide-react";

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

  const handleVerify = async (id: number) => {
    try {
      const response = await fetch('/api/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', id }),
      });
      const data = await response.json();

      if (data.success) {
        alert('经验总结已验证');
        fetchData();
      }
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  const getGainColor = (gain: number) => {
    if (gain > 0) return 'text-red-600';
    if (gain < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* 标题和操作栏 */}
      <Card className="p-6 border-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                经验库与复盘
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                成功经验总结与失败案例分析
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleBatchEvaluate}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Target className="w-4 h-4 mr-2" />
              )}
              批量评估
            </Button>
            <Button
              onClick={fetchData}
              disabled={isLoading}
              variant="outline"
              size="icon"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">成功经验</div>
              <div className="text-2xl font-bold text-green-600">{experiences.length}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500 rounded-lg">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">失败复盘</div>
              <div className="text-2xl font-bold text-red-600">{reflections.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 内容区 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="experience" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            成功经验
          </TabsTrigger>
          <TabsTrigger value="failure" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            失败复盘
          </TabsTrigger>
        </TabsList>

        {/* 成功经验 */}
        <TabsContent value="experience" className="mt-4">
          <div className="space-y-4">
            {experiences.length > 0 ? (
              experiences.map((exp) => (
                <Card key={exp.id} className="p-6 border-2">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <h3 className="font-bold text-lg">成功案例</h3>
                        {exp.isVerified && (
                          <Badge className="bg-blue-100 text-blue-700">已验证</Badge>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{exp.summary}</p>
                    </div>
                    <Button
                      onClick={() => handleVerify(exp.id)}
                      disabled={exp.isVerified}
                      variant="outline"
                      size="sm"
                    >
                      验证
                    </Button>
                  </div>

                  {/* 关键特征 */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">关键特征</div>
                    <div className="flex flex-wrap gap-2">
                      {exp.keyFeatures.map((feature, idx) => (
                        <Badge key={idx} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 涨跌幅数据 */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">T+1日</div>
                      <div className={`text-xl font-bold ${getGainColor(exp.t1Gain || 0)}`}>
                        {exp.t1Gain !== undefined ? `${exp.t1Gain.toFixed(2)}%` : '-'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">T+3日</div>
                      <div className={`text-xl font-bold ${getGainColor(exp.t3Gain || 0)}`}>
                        {exp.t3Gain !== undefined ? `${exp.t3Gain.toFixed(2)}%` : '-'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">最大涨幅</div>
                      <div className={`text-xl font-bold ${getGainColor(exp.maxGain || 0)}`}>
                        {exp.maxGain !== undefined ? `${exp.maxGain.toFixed(2)}%` : '-'}
                      </div>
                    </div>
                  </div>

                  {/* 归因分析 */}
                  {exp.attribution && Object.keys(exp.attribution).length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">归因分析</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(exp.attribution).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-1">
                            <Badge variant="outline">
                              {key === 'trend' ? '趋势' :
                               key === 'volume' ? '成交量' :
                               key === 'technical' ? '技术' :
                               key === 'pattern' ? '形态' : key}: {value}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 标签 */}
                  {exp.tags && exp.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {exp.tags.map((tag, idx) => (
                        <Badge key={idx} className="bg-green-100 text-green-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    生成时间: {formatDate(exp.createdAt)}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center border-2">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  暂无成功经验总结
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  成功验证的案例将自动生成经验总结
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 失败复盘 */}
        <TabsContent value="failure" className="mt-4">
          <div className="space-y-4">
            {reflections.length > 0 ? (
              reflections.map((ref) => (
                <Card key={ref.id} className="p-6 border-2">
                  <div className="flex items-start gap-2 mb-4">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">失败案例</h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{ref.reflection}</p>
                    </div>
                  </div>

                  {/* 失败原因 */}
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">失败原因</div>
                    <div className="text-red-700 dark:text-red-300">
                      {ref.failureReason.type}: {ref.failureReason.description}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ref.failureReason.factors.map((factor, idx) => (
                        <Badge key={idx} className="bg-red-100 text-red-700">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 涨跌幅数据 */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-950/30 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">T+1日</div>
                      <div className={`text-xl font-bold ${getGainColor(ref.t1Gain || 0)}`}>
                        {ref.t1Gain !== undefined ? `${ref.t1Gain.toFixed(2)}%` : '-'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-950/30 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">T+3日</div>
                      <div className={`text-xl font-bold ${getGainColor(ref.t3Gain || 0)}`}>
                        {ref.t3Gain !== undefined ? `${ref.t3Gain.toFixed(2)}%` : '-'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-950/30 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">最大涨幅</div>
                      <div className={`text-xl font-bold ${getGainColor(ref.maxGain || 0)}`}>
                        {ref.maxGain !== undefined ? `${ref.maxGain.toFixed(2)}%` : '-'}
                      </div>
                    </div>
                  </div>

                  {/* 问题识别 */}
                  {ref.issues && ref.issues.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">问题识别</div>
                      <div className="space-y-1">
                        {ref.issues.map((issue, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                            <span className="text-gray-700 dark:text-gray-300">{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 改进建议 */}
                  {ref.suggestions && ref.suggestions.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">改进建议</div>
                      <div className="space-y-1">
                        {ref.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                            <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    生成时间: {formatDate(ref.createdAt)}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center border-2">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  暂无失败复盘
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  未达预期的案例将自动生成复盘分析
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

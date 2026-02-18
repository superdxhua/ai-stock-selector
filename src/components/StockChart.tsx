"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface KLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  data: KLineData[];
  ma5: number[];
}

export default function StockChart({ data, ma5 }: StockChartProps) {
  // 准备图表数据 - 使用收盘价和 MA5
  const chartData = data.map((item, index) => ({
    ...item,
    ma5: ma5[index] || null,
    displayDate: item.date.slice(5), // 只显示 MM-DD
  }));

  // 计算价格范围
  const allPrices = data.flatMap((d) => [d.high, d.low]);
  const minPrice = Math.min(...allPrices) * 0.99;
  const maxPrice = Math.max(...allPrices) * 1.01;

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            interval="preserveStartEnd"
            tickCount={10}
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            orientation="right"
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#374151", fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              value.toFixed(2),
              name === "close" ? "收盘价" : "MA5",
            ]}
            labelFormatter={(label) => `日期: ${label}`}
          />
          {/* 收盘价线 */}
          <Line
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          {/* MA5 线 */}
          <Line
            type="monotone"
            dataKey="ma5"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
          />
          {/* 最新价格参考线 */}
          <ReferenceLine
            y={data[data.length - 1]?.close}
            stroke="#3b82f6"
            strokeDasharray="2 2"
            strokeOpacity={0.5}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-500 rounded"></div>
          <span className="text-muted-foreground">收盘价</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-amber-500 rounded"></div>
          <span className="text-muted-foreground">MA5 均线</span>
        </div>
      </div>
    </div>
  );
}

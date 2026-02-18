import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// GET /api/strategy-consecutive - 获取连续上榜天数
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get("strategy");
    const stockCode = searchParams.get("stockCode");

    if (!strategy) {
      return NextResponse.json(
        { success: false, error: "Strategy is required" },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    if (stockCode) {
      // 查询指定股票的连续上榜天数
      const { data, error } = await client
        .from("strategy_stock_history")
        .select("*")
        .eq("strategy", strategy)
        .eq("stock_code", stockCode)
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching consecutive days:", error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // 计算连续上榜天数
      let consecutiveDays = 0;
      let maxConsecutiveDays = 0;
      let previousDate: Date | null = null;

      for (const record of data || []) {
        const currentDate = new Date(record.date);

        if (previousDate) {
          const diffDays = Math.floor(
            (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 1) {
            consecutiveDays++;
          } else {
            consecutiveDays = 1;
          }
        } else {
          consecutiveDays = 1;
        }

        maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
        previousDate = currentDate;
      }

      return NextResponse.json({
        success: true,
        data: {
          stockCode,
          strategy,
          consecutiveDays,
          maxConsecutiveDays,
          records: data,
        },
      });
    } else {
      // 查询所有股票的连续上榜天数
      const { data, error } = await client
        .from("strategy_stock_history")
        .select("stock_code, stock_name, strategy, score, date")
        .eq("strategy", strategy)
        .order("stock_code")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching all consecutive days:", error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // 按股票分组计算连续上榜天数
      const stockGroups: Map<string, any[]> = new Map();

      for (const record of data || []) {
        if (!stockGroups.has(record.stock_code)) {
          stockGroups.set(record.stock_code, []);
        }
        stockGroups.get(record.stock_code)!.push(record);
      }

      const results = [];

      for (const [code, records] of stockGroups) {
        let consecutiveDays = 0;
        let maxConsecutiveDays = 0;
        let previousDate: Date | null = null;
        let currentStreakDays = 0;
        let latestRecord = records[records.length - 1];

        for (const record of records) {
          const currentDate = new Date(record.date);

          if (previousDate) {
            const diffDays = Math.floor(
              (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === 1) {
              consecutiveDays++;
            } else {
              consecutiveDays = 1;
            }
          } else {
            consecutiveDays = 1;
          }

          maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);

          // 检查是否是最近的连续上榜
          const today = new Date();
          const recordDate = new Date(record.date);
          const daysDiff = Math.floor(
            (today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysDiff <= consecutiveDays) {
            currentStreakDays = consecutiveDays;
          }

          previousDate = currentDate;
        }

        results.push({
          stockCode: code,
          stockName: latestRecord.stock_name,
          strategy: strategy,
          score: latestRecord.score,
          currentStreakDays,
          maxConsecutiveDays,
          latestDate: latestRecord.date,
        });
      }

      // 按当前连续上榜天数排序
      results.sort((a, b) => b.currentStreakDays - a.currentStreakDays);

      return NextResponse.json({
        success: true,
        data: results,
      });
    }
  } catch (error) {
    console.error("Consecutive days API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

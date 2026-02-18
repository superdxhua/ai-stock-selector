import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// POST /api/strategy-history - 保存策略选股历史记录
export async function POST(request: NextRequest) {
  try {
    const { strategy, stocks } = await request.json();

    if (!strategy || !Array.isArray(stocks)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const today = new Date().toISOString().split("T")[0];

    // 为每只股票创建历史记录
    const records = stocks
      .filter((stock: any) => (stock.trendScore || stock.volumeScore || 0) >= 50) // 只保存评分>=50的
      .map((stock: any) => ({
        stock_code: stock.code,
        stock_name: stock.name,
        strategy: strategy,
        score: stock.trendScore || stock.volumeScore || 0,
        price: stock.price,
        change_percent: stock.changePercent,
        volume: stock.volume,
        market_cap: stock.marketCap,
        date: today,
      }));

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stocks to save (score < 50)",
        savedCount: 0,
      });
    }

    // 使用 upsert 避免重复插入
    const { data, error } = await client
      .from("strategy_stock_history")
      .upsert(records, {
        onConflict: "stock_code,strategy,date",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("Error saving strategy history:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Strategy history saved successfully",
      savedCount: data?.length || 0,
    });
  } catch (error) {
    console.error("Strategy history API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET /api/strategy-history - 查询历史记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get("strategy");
    const date = searchParams.get("date");
    const stockCode = searchParams.get("stockCode");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const client = getSupabaseClient();
    let query = client.from("strategy_stock_history").select("*");

    // 按策略过滤
    if (strategy) {
      query = query.eq("strategy", strategy);
    }

    // 按日期过滤
    if (date) {
      query = query.eq("date", date);
    }

    // 按股票代码过滤
    if (stockCode) {
      query = query.eq("stock_code", stockCode);
    }

    // 按日期范围过滤
    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    // 按日期倒序排列
    query = query.order("date", { ascending: false }).order("score", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching strategy history:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Strategy history API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

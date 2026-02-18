import { NextRequest, NextResponse } from "next/server";
import { getStockList, selectStocks } from "@/lib/stock-data";

// GET /api/stocks - 获取股票列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get("strategy");

    let stocks;
    if (strategy) {
      stocks = selectStocks(strategy);
    } else {
      stocks = getStockList();
    }

    return NextResponse.json({ success: true, data: stocks });
  } catch (error) {
    console.error("Stock list API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

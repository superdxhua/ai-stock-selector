import { NextRequest, NextResponse } from "next/server";
import { getStockDetail } from "@/lib/stock-data";

// GET /api/stocks/:code - 获取股票详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const detail = getStockDetail(code);

    if (!detail) {
      return NextResponse.json(
        { success: false, error: "Stock not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    console.error("Stock detail API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

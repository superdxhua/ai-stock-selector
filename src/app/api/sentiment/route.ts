import { NextResponse } from "next/server";
import { calculateMarketSentiment } from "@/lib/market-sentiment";

// GET /api/sentiment - 获取市场情绪风向
export async function GET() {
  try {
    const sentiment = await calculateMarketSentiment();

    if (!sentiment) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch market sentiment data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: sentiment });
  } catch (error) {
    console.error("Market sentiment API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

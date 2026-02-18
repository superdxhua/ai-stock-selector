/**
 * 删除同花顺策略股票
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * DELETE /api/tonghuashun/stocks/[code] - 删除股票
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    const client = getSupabaseClient();

    // 删除股票
    const { error } = await client
      .from('tonghuashun_strategies')
      .delete()
      .eq('stock_code', code);

    if (error) {
      console.error('删除股票失败:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '股票删除成功',
    });
  } catch (error) {
    console.error('删除股票失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误',
    }, { status: 500 });
  }
}

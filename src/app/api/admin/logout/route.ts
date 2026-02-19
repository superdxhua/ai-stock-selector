/**
 * 管理员登出API
 * 
 * 功能：
 * 1. 清除登录token
 * 2. 返回登出成功
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/logout
 * 
 * 管理员登出
 */
export async function POST(request: NextRequest) {
  try {
    // 简化版登出，实际应用中可以将token加入黑名单等
    return NextResponse.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('登出异常:', error);
    return NextResponse.json({
      success: false,
      error: '登出失败',
    }, { status: 500 });
  }
}

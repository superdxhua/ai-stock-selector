/**
 * 会员状态检查API
 * 
 * 功能：
 * 1. 获取会员状态
 * 2. 检查是否可以查看策略
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkMembershipStatus } from '@/lib/subscription-system';

/**
 * GET /api/user/membership
 * 
 * 获取会员状态
 */
export async function GET(request: NextRequest) {
  try {
    // 从session或token中获取用户ID
    const userId = request.headers.get('x-user-id') || 'demo-user-id';
    
    const status = await checkMembershipStatus(userId);
    
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('获取会员状态失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取会员状态失败',
    }, { status: 500 });
  }
}

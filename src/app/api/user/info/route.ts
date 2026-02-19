/**
 * 获取用户信息API（积分、会员、签到信息）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserPoints, getUserMembership, getUserCheckInInfo } from '@/lib/membership-system';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user-id';
    
    const [points, membership, checkInInfo] = await Promise.all([
      getUserPoints(userId),
      getUserMembership(userId),
      getUserCheckInInfo(userId),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        points,
        membership,
        checkInInfo,
      },
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取用户信息失败',
    }, { status: 500 });
  }
}

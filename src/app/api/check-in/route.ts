/**
 * 每日签到API
 * 
 * POST /api/check-in
 */

import { NextRequest, NextResponse } from 'next/server';
import { dailyCheckIn } from '@/lib/membership-system';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user-id';
    
    const result = await dailyCheckIn(userId);
    
    return NextResponse.json({
      success: result.success,
      data: {
        pointsEarned: result.pointsEarned,
        consecutiveDays: result.consecutiveDays,
        bonusPoints: result.bonusPoints,
      },
      message: result.message,
    });
  } catch (error: any) {
    console.error('签到失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '签到失败',
    }, { status: 500 });
  }
}

/**
 * GET /api/check-in
 * 
 * 获取签到信息
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user-id';
    
    const { getUserCheckInInfo, getUserPoints } = await import('@/lib/membership-system');
    
    const checkInInfo = await getUserCheckInInfo(userId);
    const points = await getUserPoints(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        ...checkInInfo,
        points,
      },
    });
  } catch (error) {
    console.error('获取签到信息失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取签到信息失败',
    }, { status: 500 });
  }
}

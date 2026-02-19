/**
 * 获取会员套餐列表API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMembershipPackages } from '@/lib/membership-system';

export async function GET() {
  try {
    const packages = await getMembershipPackages();
    return NextResponse.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    console.error('获取套餐列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取套餐列表失败',
    }, { status: 500 });
  }
}

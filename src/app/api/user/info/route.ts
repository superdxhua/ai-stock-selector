/**
 * 用户信息API
 * 
 * 功能：
 * 1. 获取用户角色
 * 2. 获取用户会员状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRole, checkMembershipStatus } from '@/lib/subscription-system';

/**
 * GET /api/user/info
 * 
 * 获取用户完整信息（角色+会员状态）
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user-id';
    
    const [role, membership] = await Promise.all([
      checkUserRole(userId),
      checkMembershipStatus(userId),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        role: role.role,
        isAdmin: role.isAdmin,
        membership,
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

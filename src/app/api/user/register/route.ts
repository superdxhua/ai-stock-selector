/**
 * 用户注册API
 * 
 * 功能：
 * 1. 新用户注册
 * 2. 自动激活7天试用期
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { activateTrialMembership } from '@/lib/subscription-system';
import { genUUID } from '@/lib/uuid';

/**
 * POST /api/user/register
 * 
 * 注册新用户
 * 请求体: { username, email, password, phone? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, phone } = body;
    
    // 验证必填字段
    if (!username || !email || !password) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段',
      }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 检查邮箱是否已存在
    const { data: existingUser, error: checkError } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: '邮箱已被注册',
      }, { status: 400 });
    }
    
    // 创建用户
    const userId = genUUID();
    const { data: user, error: insertError } = await client
      .from('users')
      .insert({
        id: userId,
        username,
        email,
        password, // 实际应用中应该加密存储
        phone: phone || null,
        membership_level: 'free',
        membership_expire_at: null,
      })
      .select()
      .single();
    
    if (insertError || !user) {
      console.error('创建用户失败:', insertError);
      return NextResponse.json({
        success: false,
        error: '创建用户失败',
      }, { status: 500 });
    }
    
    // 自动激活7天试用期
    try {
      await activateTrialMembership(userId);
    } catch (error) {
      console.error('激活试用期失败:', error);
      // 即使激活失败也不影响注册流程
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        membershipLevel: 'trial',
      },
      message: '注册成功，已获得7天免费试用',
    });
  } catch (error) {
    console.error('注册异常:', error);
    return NextResponse.json({
      success: false,
      error: '注册异常',
    }, { status: 500 });
  }
}

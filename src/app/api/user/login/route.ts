/**
 * 用户登录API
 * 
 * 功能：
 * 1. 支持传统邮箱+密码登录
 * 2. 支持手机号免密登录（扫码注册场景）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { activateTrialMembership } from '@/lib/subscription-system';

/**
 * POST /api/user/login
 * 
 * 用户登录
 * 请求体: 
 *   - 传统方式: { email, password }
 *   - 手机号免密: { phone }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, phone } = body;
    
    const client = getSupabaseClient();
    
    // 方式1：手机号免密登录
    if (phone && !password) {
      const { data: user, error } = await client
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (error || !user) {
        return NextResponse.json({
          success: false,
          error: '手机号未注册',
        }, { status: 401 });
      }
      
      // 检查会员状态，确保有试用期
      if (user.membership_level === 'free') {
        try {
          await activateTrialMembership(user.id);
        } catch (error) {
          console.error('激活试用期失败:', error);
        }
      }
      
      // 更新最后登录时间
      await client
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);
      
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          membershipLevel: user.membership_level,
          membershipExpireAt: user.membership_expire_at,
          role: user.role || 'user',
        },
        message: '登录成功',
      });
    }
    
    // 方式2：传统邮箱密码登录
    if (email && password) {
      const { data: user, error } = await client
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
      
      if (error || !user) {
        return NextResponse.json({
          success: false,
          error: '邮箱或密码错误',
        }, { status: 401 });
      }
      
      // 更新最后登录时间
      await client
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);
      
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          membershipLevel: user.membership_level,
          membershipExpireAt: user.membership_expire_at,
          role: user.role || 'user',
        },
        message: '登录成功',
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '请提供有效的登录信息',
    }, { status: 400 });
  } catch (error) {
    console.error('登录异常:', error);
    return NextResponse.json({
      success: false,
      error: '登录异常',
    }, { status: 500 });
  }
}

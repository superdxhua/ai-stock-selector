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

// 简单的UUID生成函数
function genUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * POST /api/user/register
 * 
 * 注册新用户
 * 
 * 支持两种注册方式：
 * 1. 传统方式: { username, email, password, phone? }
 * 2. 扫码注册: { phone, username?, email? } - 手机号免密注册
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, phone } = body;
    
    const client = getSupabaseClient();
    
    // 验证必填字段 - 至少需要手机号或邮箱之一
    if (!phone && !email) {
      return NextResponse.json({
        success: false,
        error: '请提供手机号或邮箱',
      }, { status: 400 });
    }
    
    // 如果是手机号注册，使用手机号作为username
    const finalUsername = username || phone || email;
    if (!finalUsername) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段',
      }, { status: 400 });
    }
    
    // 检查用户是否已存在（通过手机号或邮箱）
    let existingUser = null;
    if (phone) {
      const { data } = await client
        .from('users')
        .select('id')
        .eq('phone', phone)
        .single();
      existingUser = data;
    }
    
    if (!existingUser && email) {
      const { data } = await client
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      existingUser = data;
    }
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: '该账号已被注册',
      }, { status: 400 });
    }
    
    // 创建用户
    const userId = genUUID();
    const { data: user, error: insertError } = await client
      .from('users')
      .insert({
        id: userId,
        username: finalUsername,
        email: email || null,
        password: password || null, // 免密注册时不设置密码
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

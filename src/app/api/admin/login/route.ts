/**
 * 管理员登录API
 * 
 * 功能：
 * 1. 验证用户名和密码
 * 2. 检查用户是否为管理员
 * 3. 生成登录token
 * 4. 返回用户信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 生成简单的token
 * 注意：生产环境应使用JWT等更安全的方式
 */
function generateToken(userId: string): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  return Buffer.from(`${userId}:${timestamp}:${random}`).toString('base64');
}

/**
 * POST /api/admin/login
 * 
 * 管理员登录
 * 请求体: { username, password }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: '用户名和密码不能为空',
      }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 查找用户
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: '用户名或密码错误',
      }, { status: 401 });
    }
    
    // 验证密码（简化版，实际应使用bcrypt等加密方式）
    if (user.password !== password) {
      return NextResponse.json({
        success: false,
        error: '用户名或密码错误',
      }, { status: 401 });
    }
    
    // 检查是否为管理员
    if (user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: '无管理员权限',
      }, { status: 403 });
    }
    
    // 生成token
    const token = generateToken(user.id);
    
    // 更新最后登录时间
    await client
      .from('users')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    // 返回登录信息
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    
    return NextResponse.json({
      success: true,
      data: {
        token,
        user: userInfo,
      },
      message: '登录成功',
    });
  } catch (error) {
    console.error('登录异常:', error);
    return NextResponse.json({
      success: false,
      error: '登录失败，请稍后重试',
    }, { status: 500 });
  }
}

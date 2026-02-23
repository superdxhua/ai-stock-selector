/**
 * 创建管理员API
 *
 * 功能：
 * 1. 创建新的管理员账号
 * 2. 验证账号信息
 * 3. 保存到数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * POST /api/admin/create
 *
 * 创建管理员账号
 * 请求体: { username, password, email }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email } = body;

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: '用户名和密码不能为空',
      }, { status: 400 });
    }

    // 验证用户名长度
    if (username.length < 3) {
      return NextResponse.json({
        success: false,
        error: '用户名至少3个字符',
      }, { status: 400 });
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: '密码至少6个字符',
      }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 检查用户名是否已存在
    const { data: existingUser, error: checkError } = await client
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: '用户名已存在',
      }, { status: 409 });
    }

    // 创建管理员账号
    const { data: newUser, error: insertError } = await client
      .from('users')
      .insert({
        username,
        password, // 注意：生产环境应使用 bcrypt 等加密方式
        email: email || `${username}@admin.local`,
        role: 'admin',
        is_admin: true,
        membership_level: 'platinum',
        membership_end_date: new Date('2099-12-31').toISOString(),
        points: 999999,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('创建管理员失败:', insertError);
      return NextResponse.json({
        success: false,
        error: '创建管理员失败',
        details: insertError.message,
      }, { status: 500 });
    }

    console.log(`✓ 管理员账号创建成功: ${username}`);

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      message: '管理员账号创建成功',
    });
  } catch (error) {
    console.error('创建管理员失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '创建管理员失败',
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/create
 *
 * 检查是否已有管理员
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 检查是否已有管理员
    const { data: admins, error } = await client
      .from('users')
      .select('id, username, email')
      .eq('role', 'admin');

    if (error) {
      return NextResponse.json({
        success: false,
        error: '查询管理员失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasAdmin: admins && admins.length > 0,
        count: admins?.length || 0,
        admins: admins || [],
      },
    });
  } catch (error) {
    console.error('查询管理员失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '查询管理员失败',
    }, { status: 500 });
  }
}

/**
 * 订单管理API（管理员功能）
 * 
 * 功能：
 * 1. 获取订单列表
 * 2. 审核订单（通过/拒绝）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { activateMembership } from '@/lib/subscription-system';

/**
 * 管理员Token验证（简化版）
 * 实际应用中应该使用更安全的认证方式
 */
function verifyAdminToken(token: string): boolean {
  // 这里应该验证管理员Token
  // 暂时简化处理
  return token === 'admin-token-123456';
}

/**
 * GET /api/admin/orders
 * 
 * 获取订单列表
 * 查询参数: 
 * - status: 订单状态（pending, paid, cancelled, expired）
 * - userId: 用户ID（可选）
 * - page: 页码
 * - limit: 每页数量
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const client = getSupabaseClient();
    
    let query = client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // 分页
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data: orders, error } = await query;
    
    if (error) {
      console.error('获取订单列表失败:', error);
      return NextResponse.json({
        success: false,
        error: '获取订单列表失败',
      }, { status: 500 });
    }
    
    // 获取总数
    let countQuery = client
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    
    if (userId) {
      countQuery = countQuery.eq('user_id', userId);
    }
    
    const { count } = await countQuery;
    
    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('获取订单列表异常:', error);
    return NextResponse.json({
      success: false,
      error: '获取订单列表异常',
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/orders
 * 
 * 审核订单（通过/拒绝）
 * 请求体: { action: 'approve' | 'reject', orderId, adminToken, reason? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, orderId, adminToken, reason } = body;
    
    // 验证管理员权限
    if (!verifyAdminToken(adminToken)) {
      return NextResponse.json({
        success: false,
        error: '权限不足',
      }, { status: 403 });
    }
    
    if (!orderId || !action) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 获取订单信息
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      return NextResponse.json({
        success: false,
        error: '订单不存在',
      }, { status: 404 });
    }
    
    // 只能审核待支付订单
    if (order.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: '订单状态不允许此操作',
      }, { status: 400 });
    }
    
    if (action === 'approve') {
      // 审核通过
      const { error: updateError } = await client
        .from('orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          remark: reason || '管理员审核通过',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      
      if (updateError) {
        console.error('更新订单状态失败:', updateError);
        return NextResponse.json({
          success: false,
          error: '更新订单状态失败',
        }, { status: 500 });
      }
      
      // 激活会员
      await activateMembership(order.user_id, order.package_id, orderId);
      
      return NextResponse.json({
        success: true,
        message: '订单审核通过',
      });
    } else if (action === 'reject') {
      // 审核拒绝
      const { error: updateError } = await client
        .from('orders')
        .update({
          status: 'cancelled',
          remark: reason || '管理员审核拒绝',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      
      if (updateError) {
        console.error('更新订单状态失败:', updateError);
        return NextResponse.json({
          success: false,
          error: '更新订单状态失败',
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: '订单已拒绝',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '无效的操作类型',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('审核订单异常:', error);
    return NextResponse.json({
      success: false,
      error: '审核订单异常',
    }, { status: 500 });
  }
}

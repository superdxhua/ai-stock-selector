/**
 * 订单管理API（简化版）
 * 
 * 功能：
 * 1. 创建订单（仅扫码支付）
 * 2. 审核订单（管理员）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getMembershipPackage, activateMembership } from '@/lib/subscription-system';

/**
 * 生成订单号
 */
function generateOrderNo(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${timestamp}${random}`;
}

/**
 * POST /api/orders
 * 
 * 创建订单（仅扫码支付）
 * 请求体: { packageId, paymentMethod }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageId, paymentMethod } = body;
    
    // 获取用户ID（从session或token中获取）
    const userId = request.headers.get('x-user-id') || 'demo-user-id';
    
    if (!packageId) {
      return NextResponse.json({
        success: false,
        error: '缺少套餐ID',
      }, { status: 400 });
    }
    
    if (!paymentMethod) {
      return NextResponse.json({
        success: false,
        error: '缺少支付方式',
      }, { status: 400 });
    }
    
    // 只支持扫码支付
    if (paymentMethod !== 'wechat' && paymentMethod !== 'alipay') {
      return NextResponse.json({
        success: false,
        error: '只支持微信和支付宝扫码支付',
      }, { status: 400 });
    }
    
    // 获取套餐信息
    const pkg = await getMembershipPackage(packageId);
    
    if (!pkg) {
      return NextResponse.json({
        success: false,
        error: '套餐不存在',
      }, { status: 404 });
    }
    
    // 试用期套餐不能购买
    if (pkg.isTrial) {
      return NextResponse.json({
        success: false,
        error: '试用套餐不能购买',
      }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 计算过期时间（2小时）
    const expiredAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    
    // 创建订单
    const orderNo = generateOrderNo();
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        user_id: userId,
        order_no: orderNo,
        package_id: pkg.id,
        package_name: pkg.name,
        amount: pkg.price,
        payment_method: paymentMethod,
        payment_info: {
          paymentMethod,
        },
        status: 'pending',
        expired_at: expiredAt.toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('创建订单失败:', orderError);
      return NextResponse.json({
        success: false,
        error: '创建订单失败',
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: order,
      message: '订单创建成功，请完成支付',
    });
  } catch (error) {
    console.error('创建订单异常:', error);
    return NextResponse.json({
      success: false,
      error: '创建订单异常',
    }, { status: 500 });
  }
}

/**
 * 订单管理API
 * 
 * 功能：
 * 1. 创建订单
 * 2. 查询订单
 * 3. 审核订单（管理员）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getMembershipPackage, activateMembership, deductPoints } from '@/lib/membership-system';

/**
 * 生成订单号
 */
function generateOrderNo(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${timestamp}${random}`;
}

/**
 * POST /api/orders/create
 * 
 * 创建订单
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
    
    // 获取套餐信息
    const pkg = await getMembershipPackage(packageId);
    
    if (!pkg) {
      return NextResponse.json({
        success: false,
        error: '套餐不存在',
      }, { status: 404 });
    }
    
    const client = getSupabaseClient();
    
    // 如果是积分支付
    if (paymentMethod === 'points') {
      if (!pkg.pointsCost) {
        return NextResponse.json({
          success: false,
          error: '该套餐不支持积分兑换',
        }, { status: 400 });
      }
      
      try {
        // 扣除积分
        await deductPoints(userId, pkg.pointsCost, `兑换会员：${pkg.name}`, {
          relatedId: userId,
          recordType: 'consume',
        });
        
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
            payment_method: 'points',
            payment_info: {
              pointsCost: pkg.pointsCost,
            },
            status: 'paid',
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (orderError) {
          throw new Error('创建订单失败');
        }
        
        // 激活会员
        await activateMembership(userId, pkg.id, {
          source: 'points',
          orderId: order.id,
        });
        
        return NextResponse.json({
          success: true,
          data: {
            orderId: order.id,
            orderNo: order.order_no,
            packageName: order.package_name,
            amount: order.amount,
            paymentMethod: order.payment_method,
            status: order.status,
          },
          message: '积分兑换成功',
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message || '积分兑换失败',
        }, { status: 400 });
      }
    }
    
    // 如果是扫码支付（收款吧、旺铺管家等）
    const orderNo = generateOrderNo();
    const expireTime = new Date();
    expireTime.setHours(expireTime.getHours() + 2); // 2小时后过期
    
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
          qrCode: `/payment/${paymentMethod}-qr.png`,
          customerService: '微信：xxx',
        },
        status: 'pending',
        expired_at: expireTime.toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (orderError) {
      throw new Error('创建订单失败');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        packageName: order.package_name,
        amount: order.amount,
        originalPrice: pkg.originalPrice,
        paymentMethod: order.payment_method,
        paymentInfo: order.payment_info,
        status: order.status,
        expiredAt: order.expired_at,
      },
      message: '订单创建成功，请扫码支付',
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json({
      success: false,
      error: '创建订单失败',
    }, { status: 500 });
  }
}


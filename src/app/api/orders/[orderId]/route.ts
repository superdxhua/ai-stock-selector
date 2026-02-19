/**
 * 订单查询API
 * 
 * 功能：
 * 查询订单详情
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET /api/orders/[orderId]
 * 
 * 查询订单详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const userId = request.headers.get('x-user-id') || 'demo-user-id';
    
    const client = getSupabaseClient();
    
    const { data: order, error } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();
    
    if (error || !order) {
      return NextResponse.json({
        success: false,
        error: '订单不存在',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('查询订单失败:', error);
    return NextResponse.json({
      success: false,
      error: '查询订单失败',
    }, { status: 500 });
  }
}

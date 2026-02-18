/**
 * 调度器初始化API
 * 
 * 功能：启动或检查调度器状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScheduler, startScheduler } from '@/lib/task-scheduler';

/**
 * POST /api/scheduler/init - 初始化调度器
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'start';

    if (action === 'start') {
      startScheduler();
      const scheduler = getScheduler();
      const status = scheduler.getStatus();

      return NextResponse.json({
        success: true,
        message: '调度器已初始化',
        status,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'check') {
      const scheduler = getScheduler();
      const status = scheduler.getStatus();

      return NextResponse.json({
        success: true,
        status,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: '未知操作',
        availableActions: ['start', 'check'],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('初始化调度器失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '初始化失败',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scheduler/init - 检查调度器状态
 */
export async function GET(request: NextRequest) {
  try {
    const scheduler = getScheduler();
    const status = scheduler.getStatus();

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('检查调度器状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '检查失败',
      },
      { status: 500 }
    );
  }
}

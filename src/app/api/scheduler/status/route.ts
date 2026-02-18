/**
 * 任务管理API
 * 
 * 功能：
 * 1. 查询调度器状态
 * 2. 查询任务执行记录
 * 3. 手动触发任务执行
 * 4. 启动/停止调度器
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScheduler, startScheduler, stopScheduler, TaskType } from '@/lib/task-scheduler';
import { getTradingStatus } from '@/lib/trading-time';

/**
 * GET /api/scheduler/status - 查询调度器状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const type = searchParams.get('type') as TaskType | null;

    // 查询调度器状态
    if (action === 'status') {
      const scheduler = getScheduler();
      const status = scheduler.getStatus();
      const tradingStatus = getTradingStatus();

      return NextResponse.json({
        success: true,
        scheduler: status,
        trading: tradingStatus,
        timestamp: new Date().toISOString(),
      });
    }

    // 查询任务执行记录
    if (action === 'executions') {
      const scheduler = getScheduler();
      const limit = parseInt(searchParams.get('limit') || '20');

      if (type) {
        const executions = scheduler.getExecutionsByType(type, limit);
        return NextResponse.json({
          success: true,
          type,
          executions,
          count: executions.length,
        });
      } else {
        const executions = scheduler.getExecutions(limit);
        return NextResponse.json({
          success: true,
          executions,
          count: executions.length,
        });
      }
    }

    // 查询交易时间状态
    if (action === 'trading') {
      const tradingStatus = getTradingStatus();
      return NextResponse.json({
        success: true,
        trading: tradingStatus,
        timestamp: new Date().toISOString(),
      });
    }

    // 默认返回调度器状态
    const scheduler = getScheduler();
    const status = scheduler.getStatus();
    const tradingStatus = getTradingStatus();
    const executions = scheduler.getExecutions(10);

    return NextResponse.json({
      success: true,
      scheduler: status,
      trading: tradingStatus,
      recentExecutions: executions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('查询调度器状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduler/status - 控制调度器
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    // 启动调度器
    if (action === 'start') {
      startScheduler();
      return NextResponse.json({
        success: true,
        message: '调度器已启动',
        timestamp: new Date().toISOString(),
      });
    }

    // 停止调度器
    if (action === 'stop') {
      stopScheduler();
      return NextResponse.json({
        success: true,
        message: '调度器已停止',
        timestamp: new Date().toISOString(),
      });
    }

    // 手动触发任务
    if (action === 'trigger') {
      const taskType = body.type as TaskType;
      if (!taskType) {
        return NextResponse.json(
          { success: false, error: '缺少任务类型' },
          { status: 400 }
        );
      }

      // 获取调度器
      const scheduler = getScheduler();

      // 检查是否在交易时间（除手动触发外）
      const tradingStatus = getTradingStatus();
      if (!tradingStatus.isTrading && !body.force) {
        return NextResponse.json({
          success: false,
          error: '当前不在交易时间',
          tradingStatus,
          message: '使用 force=true 可强制执行',
        });
      }

      // 手动执行任务
      await scheduler.executeManually(taskType);

      return NextResponse.json({
        success: true,
        message: `任务 ${taskType} 已触发执行`,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: '未知操作',
        availableActions: ['start', 'stop', 'trigger'],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('控制调度器失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '操作失败',
      },
      { status: 500 }
    );
  }
}

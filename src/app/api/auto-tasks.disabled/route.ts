import { NextRequest, NextResponse } from 'next/server';
import {
  initializeAllAutoTasks,
  startAllAutoTasks,
  stopAllAutoTasks,
  getAllTaskStatus,
  triggerTask,
  AutoTaskType,
} from '@/lib/auto-task-scheduler';

/**
 * GET /api/auto-tasks/status - 获取所有任务状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // 获取所有任务状态
    if (action === 'status') {
      const status = getAllTaskStatus();
      return NextResponse.json({
        success: true,
        data: status,
      });
    }

    return NextResponse.json({
      success: false,
      error: '无效的操作',
    });
  } catch (error) {
    console.error('获取任务状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取任务状态失败',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auto-tasks - 控制自动任务系统
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, taskType } = body;

    switch (action) {
      case 'init':
        // 初始化所有自动任务
        initializeAllAutoTasks();
        return NextResponse.json({
          success: true,
          message: '自动任务系统初始化完成',
        });

      case 'start':
        // 启动所有自动任务
        startAllAutoTasks();
        return NextResponse.json({
          success: true,
          message: '所有自动任务已启动',
        });

      case 'stop':
        // 停止所有自动任务
        stopAllAutoTasks();
        return NextResponse.json({
          success: true,
          message: '所有自动任务已停止',
        });

      case 'trigger':
        // 手动触发指定任务
        if (!taskType) {
          return NextResponse.json(
            {
              success: false,
              error: '缺少taskType参数',
            },
            { status: 400 }
          );
        }

        const result = await triggerTask(taskType as AutoTaskType);
        return NextResponse.json({
          success: true,
          message: `任务 ${taskType} 已触发`,
          data: result,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '无效的操作',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('控制自动任务失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '控制自动任务失败',
      },
      { status: 500 }
    );
  }
}

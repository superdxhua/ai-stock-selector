/**
 * 经验总结和复盘API
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getExperienceSummaries,
  getFailureReflections,
  verifyExperienceSummary,
  batchEvaluateCompletedRecords,
} from '@/lib/experience-analysis';
import {
  getAllTrackingRecords,
  getTrackingStatistics,
} from '@/lib/stock-tracking';

/**
 * GET /api/experience - 获取经验总结或失败复盘
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'experience' or 'failure' or 'stats'
    const verified = searchParams.get('verified') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    // 获取统计信息
    if (type === 'stats') {
      const stats = await getTrackingStatistics();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // 获取成功经验
    if (type === 'experience') {
      const experiences = await getExperienceSummaries(verified, limit);
      return NextResponse.json({
        success: true,
        type: 'experience',
        data: experiences,
        count: experiences.length,
      });
    }

    // 获取失败复盘
    if (type === 'failure') {
      const reflections = await getFailureReflections(limit);
      return NextResponse.json({
        success: true,
        type: 'failure',
        data: reflections,
        count: reflections.length,
      });
    }

    // 获取所有跟踪记录
    if (type === 'records') {
      const status = searchParams.get('status') || undefined;
      const result = searchParams.get('result') || undefined;

      const records = await getAllTrackingRecords(status, result, limit);
      return NextResponse.json({
        success: true,
        type: 'records',
        data: records,
        count: records.length,
      });
    }

    // 默认返回统计信息
    const stats = await getTrackingStatistics();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('获取数据失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取数据失败',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/experience - 批量评估或验证
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    // 批量评估已完成跟踪的记录
    if (action === 'evaluate') {
      const limit = body.limit || 100;
      const result = await batchEvaluateCompletedRecords(limit);
      return NextResponse.json({
        success: true,
        message: `已评估 ${result.processed} 条记录`,
        ...result,
      });
    }

    // 验证经验总结
    if (action === 'verify') {
      const id = body.id;
      if (!id) {
        return NextResponse.json(
          { success: false, error: '缺少ID' },
          { status: 400 }
        );
      }

      await verifyExperienceSummary(id);
      return NextResponse.json({
        success: true,
        message: '经验总结已验证',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: '未知操作',
        availableActions: ['evaluate', 'verify'],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('操作失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '操作失败',
      },
      { status: 500 }
    );
  }
}

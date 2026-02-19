/**
 * 经验自动生成模块
 *
 * 功能：
 * 1. 批量评估已完成的跟踪记录
 * 2. 自动生成成功经验
 * 3. 自动生成失败复盘
 * 4. 保存到经验库
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// 不在模块级别初始化 Supabase 客户端
// 改为在每个需要使用的函数内部初始化

/**
 * 执行批量经验生成
 */
export async function generateBatchExperiences(): Promise<any> {
  console.log('💡 开始批量生成经验');

  // 在函数内部初始化 Supabase 客户端
  const supabase = getSupabaseClient();

  let successCount = 0;
  let failureCount = 0;
  let skipCount = 0;

  try {
    // 获取所有已完成的跟踪记录
    const { data: trackingRecords, error: fetchError } = await supabase
      .from('stock_tracking')
      .select('*')
      .eq('status', 'completed')
      .order('tracking_start_date', { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error('  ✗ 获取跟踪记录失败:', fetchError);
      return {
        success: false,
        error: fetchError.message,
      };
    }

    console.log(`  → 找到 ${trackingRecords.length} 条已完成的跟踪记录`);

    for (const record of trackingRecords) {
      // 检查是否已生成经验
      const { data: existingExperience } = await supabase
        .from('experience_library')
        .select('*')
        .eq('tracking_id', record.id)
        .single();

      if (existingExperience) {
        skipCount++;
        console.log(`  ⊘ 跳过已生成经验的记录: ${record.stock_name}`);
        continue;
      }

      // 根据结果生成经验
      const experience = await generateExperienceFromRecord(record);

      if (experience) {
        successCount++;
        console.log(
          `  ✓ 生成${experience.experience_type === 'success' ? '成功经验' : '失败复盘'}: ${
            record.stock_name
          }`,
        );
      }
    }

    console.log(`\n📊 经验生成完成:`);
    console.log(`  - 新生成: ${successCount} 条`);
    console.log(`  - 已跳过: ${skipCount} 条`);

    return {
      success: true,
      total: trackingRecords.length,
      generated: successCount,
      skipped: skipCount,
    };
  } catch (error) {
    console.error(`  ✗ 批量生成失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '批量生成失败',
    };
  }
}

/**
 * 从跟踪记录生成经验
 */
async function generateExperienceFromRecord(record: any): Promise<any | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

    // 调用API生成经验
    const response = await fetch(`${baseUrl}/api/experience/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tracking_id: record.id,
        auto_mode: true,
      }),
    });

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      console.error(`  ✗ 生成经验失败 (${record.stock_name}):`, result.error);
      return null;
    }
  } catch (error) {
    console.error(`  ✗ 生成经验失败 (${record.stock_name}):`, error);
    return null;
  }
}

/**
 * 执行单条记录的经验生成
 */
export async function generateExperienceFromTracking(trackingId: string): Promise<any> {
  console.log(`💡 开始生成经验 (tracking_id: ${trackingId})`);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  try {
    const response = await fetch(`${baseUrl}/api/experience/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tracking_id: trackingId,
        auto_mode: true,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`  ✓ 经验生成完成`);
      return {
        success: true,
        data: result.data,
      };
    } else {
      console.error(`  ✗ 经验生成失败:`, result.error);
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error(`  ✗ 经验生成失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '执行失败',
    };
  }
}

# 数据库使用指南

## 数据库已创建

项目已经使用 Supabase 创建了数据库表结构，通过以下步骤完成：

1. **同步模型**：执行 `coze-coding-ai db generate-models` 获取数据库 schema
2. **定义表结构**：在 `src/storage/database/shared/schema.ts` 中定义了4个核心表
3. **同步到数据库**：执行 `coze-coding-ai db upgrade` 创建表

## 数据库表结构

### 1. stock_tracking_records（筛选记录表）
存储所有筛选出的龙头个股信息。

**字段说明**：
- `id` - 主键
- `stock_code` - 股票代码
- `stock_name` - 股票名称
- `strategy` - 筛选策略（5day-trend、5day-volume、leader）
- `bull_score` - 大牛股评分
- `potential_level` - 潜力等级（high/medium/low）
- `price` - 筛选时价格
- `change_percent` - 筛选时涨跌幅
- `volume` - 成交量
- `market_cap` - 市值
- `tracking_status` - 跟踪状态（pending/tracking/completed/failed）
- `expected_gain` - 预期涨幅（默认10%）
- `t1_gain` - T+1日涨幅
- `t3_gain` - T+3日涨幅
- `max_gain` - 最大涨幅
- `result` - 结果（success/failed）
- `screened_at` - 筛选时间
- `completed_at` - 完成时间

**使用场景**：每次筛选出龙头个股后，自动保存到此表。

### 2. tracking_observations（观察记录表）
存储T+1、T+3日的观察数据。

**字段说明**：
- `id` - 主键
- `tracking_record_id` - 关联的筛选记录ID
- `observation_day` - 观察天数（1=T+1, 3=T+3）
- `price` - 观察时价格
- `change_percent` - 涨跌幅
- `volume` - 成交量
- `turnover_rate` - 换手率
- `limit_up` - 是否涨停
- `limit_down` - 是否跌停
- `observed_at` - 观察时间

**使用场景**：每日定时任务获取T+1、T+3日数据后保存到此表。

### 3. experience_summaries（成功经验表）
存储成功案例的经验总结。

**字段说明**：
- `id` - 主键
- `tracking_record_id` - 关联的筛选记录ID
- `summary` - 经验总结文本
- `key_features` - 关键特征数组
- `t1_gain` - T+1日涨幅
- `t3_gain` - T+3日涨幅
- `max_gain` - 最大涨幅
- `attribution` - 归因分析（趋势、成交量、技术指标、形态的贡献度）
- `tags` - 标签数组
- `is_verified` - 是否已验证

**使用场景**：验证成功的案例自动生成经验总结，可人工验证。

### 4. failure_reflections（失败复盘表）
存储失败案例的复盘分析。

**字段说明**：
- `id` - 主键
- `tracking_record_id` - 关联的筛选记录ID
- `reflection` - 复盘分析文本
- `failure_reason` - 失败原因（类型、描述、因素）
- `issues` - 问题识别数组
- `suggestions` - 改进建议数组

**使用场景**：验证失败的案例自动生成复盘分析。

## 如何使用数据库

### 1. 自动存储（无需手动操作）

系统已经实现了自动存储流程：

**筛选时自动保存**：
```typescript
// src/app/api/bull-analysis/route.ts
// 每次筛选出龙头个股后，自动保存到数据库
const { saveTrackingRecordsBatch } = await import('@/lib/stock-tracking');
await saveTrackingRecordsBatch(result); // 批量保存筛选结果
```

**跟踪时自动更新**：
```typescript
// src/lib/tracking-tasks.ts
// 定时任务自动获取T+1、T+3日数据并更新数据库
await saveObservation(trackingRecordId, day, price, changePercent, ...);
await updateTrackingRecord(id, { t1Gain: gain });
```

**完成后自动总结**：
```typescript
// src/lib/experience-analysis.ts
// 验证完成后自动生成经验总结或复盘分析
await generateExperienceSummary(record); // 成功案例
await generateFailureReflection(record); // 失败案例
```

### 2. 手动查询（查看数据）

通过API查询数据库中的数据：

**查询统计信息**：
```bash
curl "http://localhost:5000/api/experience?type=stats"
```

**查询跟踪记录**：
```bash
# 查询所有记录
curl "http://localhost:5000/api/experience?type=records"

# 查询待跟踪记录
curl "http://localhost:5000/api/experience?type=records&status=pending"

# 查询成功案例
curl "http://localhost:5000/api/experience?type=records&result=success"
```

**查询成功经验**：
```bash
curl "http://localhost:5000/api/experience?type=experience"
```

**查询失败复盘**：
```bash
curl "http://localhost:5000/api/experience?type=failure"
```

### 3. UI界面查看

系统提供了完整的UI界面来查看数据库中的数据：

**跟踪管理界面**（http://localhost:5000 → 👁️ 跟踪）：
- 查看所有筛选记录
- 按状态筛选（待跟踪/跟踪中/已完成/成功/失败）
- 显示涨跌数据（T+1、T+3、最大涨幅）
- 统计信息展示

**经验库界面**（http://localhost:5000 → 💡 经验）：
- 查看成功经验（特征、归因分析、标签）
- 查看失败复盘（原因、问题、建议）
- 支持验证经验总结
- 支持批量评估

### 4. 在代码中使用数据库

如果需要在代码中直接使用数据库，参考以下示例：

**保存数据**：
```typescript
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 保存筛选记录
const { data, error } = await client
  .from('stock_tracking_records')
  .insert({
    stock_code: '600519',
    stock_name: '贵州茅台',
    strategy: 'leader',
    bull_score: 85,
    price: 1800.50,
    change_percent: 5.2,
    tracking_status: 'pending',
    screened_at: new Date().toISOString(),
  })
  .select();

if (error) {
  console.error('保存失败:', error);
} else {
  console.log('保存成功:', data);
}
```

**查询数据**：
```typescript
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 查询所有待跟踪记录
const { data, error } = await client
  .from('stock_tracking_records')
  .select('*')
  .eq('tracking_status', 'pending')
  .order('screened_at', { ascending: false })
  .limit(20);

console.log(data); // 获取到的记录数组
```

**更新数据**：
```typescript
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 更新跟踪记录
const { data, error } = await client
  .from('stock_tracking_records')
  .update({
    tracking_status: 'tracking',
    t1_gain: 3.5,
  })
  .eq('id', 1);

console.log(data); // 更新后的记录
```

**删除数据**：
```typescript
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 删除记录
const { error } = await client
  .from('stock_tracking_records')
  .delete()
  .eq('id', 1);

if (!error) {
  console.log('删除成功');
}
```

## 数据流示例

### 完整的跟踪流程

```
1. 用户筛选龙头个股
   ↓
2. 系统自动保存到 stock_tracking_records 表
   (tracking_status = 'pending')
   ↓
3. 定时任务（9:30）标记为跟踪中
   (tracking_status = 'tracking')
   ↓
4. 定时任务（次日9:35）获取T+1日数据
   保存到 tracking_observations 表
   更新 stock_tracking_records.t1_gain
   ↓
5. 定时任务（3日后9:35）获取T+3日数据
   保存到 tracking_observations 表
   更新 stock_tracking_records.t3_gain
   评估结果：T+3涨幅 >= 10%？
   ↓
6a. 成功 → 标记为成功
   (tracking_status = 'completed', result = 'success')
   生成经验总结到 experience_summaries 表
   ↓
6b. 失败 → 标记为失败
   (tracking_status = 'completed', result = 'failed')
   生成复盘分析到 failure_reflections 表
   ↓
7. 用户在UI界面查看和验证经验
```

## 常见问题

### Q1: 如何查看数据库中的数据？
A: 可以通过以下方式查看：
1. 使用UI界面（👁️ 跟踪、💡 经验）
2. 使用API接口（curl命令）
3. 直接访问Supabase控制台查看数据库表

### Q2: 如何删除测试数据？
A: 可以通过以下方式删除：
1. 使用代码中的删除功能（参考上面的删除示例）
2. 在Supabase控制台直接删除表中的记录

### Q3: 如何修改表结构？
A: 如果需要修改表结构，需要：
1. 修改 `src/storage/database/shared/schema.ts` 文件
2. 执行 `coze-coding-ai db upgrade` 同步到数据库
3. 注意：已有数据的表新增字段时不要使用 `.notNull()`

### Q4: 数据存储在哪里？
A: 数据存储在Supabase云数据库中，通过环境变量配置连接。Supabase提供了免费的数据库服务。

### Q5: 如何备份数据？
A: Supabase提供了自动备份功能，也可以在控制台手动导出数据。

## 注意事项

1. **字段命名**：数据库字段使用 snake_case（如 `stock_code`），代码中使用 camelCase（如 `stockCode`）
2. **时间格式**：所有时间字段使用 ISO 8601 格式（`new Date().toISOString()`）
3. **数值精度**：价格、涨幅等数值使用 `numeric` 类型，注意精度设置
4. **外键关联**：`tracking_observations`、`experience_summaries`、`failure_reflections` 通过 `tracking_record_id` 关联到 `stock_tracking_records`

## 参考资料

- Supabase 文档：https://supabase.com/docs
- 数据操作示例：`/workspace/projects/src/lib/stock-tracking.ts`
- API 接口：`/workspace/projects/src/app/api/experience/route.ts`

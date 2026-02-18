import { pgTable, index, unique, bigserial, varchar, integer, numeric, timestamp, serial, text, jsonb, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const strategyStockHistory = pgTable("strategy_stock_history", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	stockCode: varchar("stock_code", { length: 20 }).notNull(),
	stockName: varchar("stock_name", { length: 100 }).notNull(),
	strategy: varchar({ length: 50 }).notNull(),
	score: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	changePercent: numeric("change_percent", { precision: 5, scale:  2 }).notNull(),
	volume: bigserial({ mode: "bigint" }).notNull(),
	marketCap: bigserial("market_cap", { mode: "bigint" }).notNull(),
	date: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_strategy_stock_history_date").using("btree", table.date.asc().nullsLast().op("timestamptz_ops")),
	index("idx_strategy_stock_history_stock").using("btree", table.stockCode.asc().nullsLast().op("text_ops"), table.strategy.asc().nullsLast().op("text_ops")),
	index("idx_strategy_stock_history_stock_date").using("btree", table.stockCode.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
	index("idx_strategy_stock_history_strategy").using("btree", table.strategy.asc().nullsLast().op("text_ops")),
	unique("unique_stock_strategy_date").on(table.stockCode, table.strategy, table.date),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 龙头个股筛选记录
export const stockTrackingRecords = pgTable("stock_tracking_records", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	stockCode: varchar("stock_code", { length: 20 }).notNull(),
	stockName: varchar("stock_name", { length: 100 }).notNull(),
	strategy: varchar({ length: 50 }).notNull(),
	bullScore: integer().notNull(),
	potentialLevel: varchar("potential_level", { length: 20 }).notNull(),
	price: numeric({ precision: 10, scale: 2 }).notNull(),
	changePercent: numeric("change_percent", { precision: 5, scale: 2 }).notNull(),
	volume: bigserial({ mode: "bigint" }).notNull(),
	marketCap: bigserial("market_cap", { mode: "bigint" }).notNull(),
	turnoverRate: numeric("turnover_rate", { precision: 5, scale: 2 }),
	pe: numeric({ precision: 10, scale: 2 }),
	pb: numeric({ precision: 10, scale: 2 }),
	bullFeatures: jsonb("bull_features"),
	recommendedStrategies: jsonb("recommended_strategies"),
	// 跟踪状态
	trackingStatus: varchar("tracking_status", { length: 20 }).notNull().default("pending"), // pending, tracking, completed, failed
	// 验证结果
	expectedGain: numeric("expected_gain", { precision: 5, scale: 2 }).default(sql`10`), // 预期涨幅%
	t1Gain: numeric("t1_gain", { precision: 5, scale: 2 }), // T+1日涨幅%
	t3Gain: numeric("t3_gain", { precision: 5, scale: 2 }), // T+3日涨幅%
	maxGain: numeric("max_gain", { precision: 5, scale: 2 }), // 最大涨幅%
	// 结果评估
	result: varchar("result", { length: 20 }), // success, failed, pending
	// 筛选时间
	screenedAt: timestamp("screened_at", { withTimezone: true, mode: 'string' }).notNull(),
	// 跟踪完成时间
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_stock_tracking_records_screened_at").using("btree", table.screenedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_stock_tracking_records_stock").using("btree", table.stockCode.asc().nullsLast().op("text_ops")),
	index("idx_stock_tracking_records_status").using("btree", table.trackingStatus.asc().nullsLast().op("text_ops")),
	index("idx_stock_tracking_records_result").using("btree", table.result.asc().nullsLast().op("text_ops")),
	unique("unique_stock_screened_at").on(table.stockCode, table.screenedAt),
]);

// 跟踪观察记录
export const trackingObservations = pgTable("tracking_observations", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	trackingRecordId: bigserial({ mode: "bigint" }).notNull().references(() => stockTrackingRecords.id, { onDelete: 'cascade' }),
	observationDay: integer("observation_day").notNull(), // T+1, T+3
	price: numeric({ precision: 10, scale: 2 }).notNull(),
	changePercent: numeric("change_percent", { precision: 5, scale: 2 }).notNull(),
	volume: bigserial({ mode: "bigint" }).notNull(),
	turnoverRate: numeric("turnover_rate", { precision: 5, scale: 2 }),
	limitUp: boolean("limit_up").default(false),
	limitDown: boolean("limit_down").default(false),
	notes: text("notes"),
	observedAt: timestamp("observed_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tracking_observations_tracking_record_id").using("btree", table.trackingRecordId.asc().nullsLast().op("numeric_ops")),
	index("idx_tracking_observations_observed_at").using("btree", table.observedAt.asc().nullsLast().op("timestamptz_ops")),
]);

// 成功经验总结
export const experienceSummaries = pgTable("experience_summaries", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	trackingRecordId: bigserial({ mode: "bigint" }).notNull().references(() => stockTrackingRecords.id, { onDelete: 'cascade' }),
	summary: text("summary").notNull(),
	// 关键特征
	keyFeatures: jsonb("key_features"), // 命中的关键特征列表
	// 成功指标
	t1Gain: numeric("t1_gain", { precision: 5, scale: 2 }),
	t3Gain: numeric("t3_gain", { precision: 5, scale: 2 }),
	maxGain: numeric("max_gain", { precision: 5, scale: 2 }),
	// 归因分析
	attribution: jsonb("attribution"), // 成功原因分析
	// 标签
	tags: jsonb("tags"), // 标签数组
	isVerified: boolean("is_verified").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_experience_summaries_tracking_record_id").using("btree", table.trackingRecordId.asc().nullsLast().op("numeric_ops")),
	index("idx_experience_summaries_created_at").using("btree", table.createdAt.desc().nullsLast().op("timestamptz_ops")),
]);

// 失败复盘
export const failureReflections = pgTable("failure_reflections", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	trackingRecordId: bigserial({ mode: "bigint" }).notNull().references(() => stockTrackingRecords.id, { onDelete: 'cascade' }),
	reflection: text("reflection").notNull(),
	// 失败原因分析
	failureReason: jsonb("failure_reason"), // 失败原因分类
	// 实际表现
	t1Gain: numeric("t1_gain", { precision: 5, scale: 2 }),
	t3Gain: numeric("t3_gain", { precision: 5, scale: 2 }),
	maxGain: numeric("max_gain", { precision: 5, scale: 2 }),
	// 问题识别
	issues: jsonb("issues"), // 问题列表
	// 改进建议
	suggestions: jsonb("suggestions"), // 改进建议
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_failure_reflections_tracking_record_id").using("btree", table.trackingRecordId.asc().nullsLast().op("numeric_ops")),
	index("idx_failure_reflections_created_at").using("btree", table.createdAt.desc().nullsLast().op("timestamptz_ops")),
]);

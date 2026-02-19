import { pgTable, index, unique, bigserial, varchar, integer, numeric, timestamp, serial, foreignKey, text, jsonb, boolean } from "drizzle-orm/pg-core"
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

export const experienceSummaries = pgTable("experience_summaries", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	trackingRecordId: bigserial({ mode: "bigint" }).notNull(),
	summary: text().notNull(),
	keyFeatures: jsonb("key_features"),
	t1Gain: numeric("t1_gain", { precision: 5, scale:  2 }),
	t3Gain: numeric("t3_gain", { precision: 5, scale:  2 }),
	maxGain: numeric("max_gain", { precision: 5, scale:  2 }),
	attribution: jsonb(),
	tags: jsonb(),
	isVerified: boolean("is_verified").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.trackingRecordId],
			foreignColumns: [stockTrackingRecords.id],
			name: "experience_summaries_trackingRecordId_stock_tracking_records_id"
		}).onDelete("cascade"),
]);

export const failureReflections = pgTable("failure_reflections", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	trackingRecordId: bigserial({ mode: "bigint" }).notNull(),
	reflection: text().notNull(),
	failureReason: jsonb("failure_reason"),
	t1Gain: numeric("t1_gain", { precision: 5, scale:  2 }),
	t3Gain: numeric("t3_gain", { precision: 5, scale:  2 }),
	maxGain: numeric("max_gain", { precision: 5, scale:  2 }),
	issues: jsonb(),
	suggestions: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.trackingRecordId],
			foreignColumns: [stockTrackingRecords.id],
			name: "failure_reflections_trackingRecordId_stock_tracking_records_id_"
		}).onDelete("cascade"),
]);

export const stockTrackingRecords = pgTable("stock_tracking_records", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	stockCode: varchar("stock_code", { length: 20 }).notNull(),
	stockName: varchar("stock_name", { length: 100 }).notNull(),
	strategy: varchar({ length: 50 }).notNull(),
	bullScore: integer().notNull(),
	potentialLevel: varchar("potential_level", { length: 20 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	changePercent: numeric("change_percent", { precision: 5, scale:  2 }).notNull(),
	volume: bigserial({ mode: "bigint" }).notNull(),
	marketCap: bigserial("market_cap", { mode: "bigint" }).notNull(),
	turnoverRate: numeric("turnover_rate", { precision: 5, scale:  2 }),
	pe: numeric({ precision: 10, scale:  2 }),
	pb: numeric({ precision: 10, scale:  2 }),
	bullFeatures: jsonb("bull_features"),
	recommendedStrategies: jsonb("recommended_strategies"),
	trackingStatus: varchar("tracking_status", { length: 20 }).default('pending').notNull(),
	expectedGain: numeric("expected_gain", { precision: 5, scale:  2 }).default('10'),
	t1Gain: numeric("t1_gain", { precision: 5, scale:  2 }),
	t3Gain: numeric("t3_gain", { precision: 5, scale:  2 }),
	maxGain: numeric("max_gain", { precision: 5, scale:  2 }),
	result: varchar({ length: 20 }),
	screenedAt: timestamp("screened_at", { withTimezone: true, mode: 'string' }).notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("unique_stock_screened_at").on(table.stockCode, table.screenedAt),
]);

export const trackingObservations = pgTable("tracking_observations", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	trackingRecordId: bigserial({ mode: "bigint" }).notNull(),
	observationDay: integer("observation_day").notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	changePercent: numeric("change_percent", { precision: 5, scale:  2 }).notNull(),
	volume: bigserial({ mode: "bigint" }).notNull(),
	turnoverRate: numeric("turnover_rate", { precision: 5, scale:  2 }),
	limitUp: boolean("limit_up").default(false),
	limitDown: boolean("limit_down").default(false),
	notes: text(),
	observedAt: timestamp("observed_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.trackingRecordId],
			foreignColumns: [stockTrackingRecords.id],
			name: "tracking_observations_trackingRecordId_stock_tracking_records_i"
		}).onDelete("cascade"),
]);

export const tonghuashunStrategies = pgTable("tonghuashun_strategies", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	stockCode: varchar("stock_code", { length: 20 }).notNull(),
	stockName: varchar("stock_name", { length: 100 }).notNull(),
	strategyType: varchar("strategy_type", { length: 50 }).notNull(),
	reason: text(),
	source: varchar({ length: 100 }).default('manual'),
	learnedFeatures: jsonb("learned_features"),
	price: numeric({ precision: 10, scale:  2 }),
	changePercent: numeric("change_percent", { precision: 5, scale:  2 }),
	addedAt: timestamp("added_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_tonghuashun_strategies_source").using("btree", table.source.asc().nullsLast().op("text_ops")),
	index("idx_tonghuashun_strategies_type").using("btree", table.strategyType.asc().nullsLast().op("text_ops")),
	unique("unique_stock_strategy").on(table.stockCode, table.strategyType),
]);

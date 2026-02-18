import { pgTable, serial, timestamp, varchar, integer, decimal, bigserial, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { index } from "drizzle-orm/pg-core"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 策略股票历史记录表
export const strategyStockHistory = pgTable(
  "strategy_stock_history",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    stockCode: varchar("stock_code", { length: 20 }).notNull(),
    stockName: varchar("stock_name", { length: 100 }).notNull(),
    strategy: varchar("strategy", { length: 50 }).notNull(),
    score: integer("score").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull(),
    volume: bigserial("volume", { mode: "number" }).notNull(),
    marketCap: bigserial("market_cap", { mode: "number" }).notNull(),
    date: timestamp("date", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    unique("unique_stock_strategy_date").on(table.stockCode, table.strategy, table.date),
    index("idx_strategy_stock_history_date").on(table.date),
    index("idx_strategy_stock_history_strategy").on(table.strategy),
    index("idx_strategy_stock_history_stock").on(table.stockCode, table.strategy),
    index("idx_strategy_stock_history_stock_date").on(table.stockCode, table.date),
  ]
);

/**
 * 沪深交易所交易时间管理
 * 
 * 功能：
 * 1. 检测当前是否为交易时间
 * 2. 检测距离下一个交易时间的倒计时
 * 3. 获取交易时段信息
 */

/**
 * 沪深交易所交易时段
 */
export interface TradingSession {
  name: string;
  startTime: string; // HH:mm格式
  endTime: string; // HH:mm格式
  type: 'morning' | 'afternoon';
}

export const TRADING_SESSIONS: TradingSession[] = [
  { name: '早盘', startTime: '09:30', endTime: '11:30', type: 'morning' },
  { name: '午盘', startTime: '13:00', endTime: '15:00', type: 'afternoon' },
];

/**
 * 沪深交易所交易日（周一到周五）
 */
export const TRADING_DAYS = [1, 2, 3, 4, 5]; // 0=周日, 1=周一, ..., 6=周六

/**
 * 节假日列表（示例，实际应该从外部配置或API获取）
 */
export const HOLIDAYS: string[] = [
  // 格式：YYYY-MM-DD
  // '2024-01-01', // 元旦
  // '2024-02-10', // 春节
  // ...
];

/**
 * 检查当前是否为交易日
 */
export function isTradingDay(date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay();

  // 检查是否为周一到周五
  if (!TRADING_DAYS.includes(dayOfWeek)) {
    return false;
  }

  // 检查是否为节假日
  const dateStr = formatDate(date);
  if (HOLIDAYS.includes(dateStr)) {
    return false;
  }

  return true;
}

/**
 * 检查当前是否在交易时间内
 */
export function isTradingTime(date: Date = new Date()): boolean {
  // 首先检查是否为交易日
  if (!isTradingDay(date)) {
    return false;
  }

  const currentTime = date.getHours() * 60 + date.getMinutes();

  // 检查是否在任一交易时段内
  for (const session of TRADING_SESSIONS) {
    const [startHour, startMinute] = session.startTime.split(':').map(Number);
    const [endHour, endMinute] = session.endTime.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (currentTime >= startTime && currentTime <= endTime) {
      return true;
    }
  }

  return false;
}

/**
 * 获取当前交易时段
 */
export function getCurrentTradingSession(date: Date = new Date()): TradingSession | null {
  if (!isTradingDay(date)) {
    return null;
  }

  const currentTime = date.getHours() * 60 + date.getMinutes();

  for (const session of TRADING_SESSIONS) {
    const [startHour, startMinute] = session.startTime.split(':').map(Number);
    const [endHour, endMinute] = session.endTime.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (currentTime >= startTime && currentTime <= endTime) {
      return session;
    }
  }

  return null;
}

/**
 * 获取距离下一个交易时间的倒计时（秒）
 */
export function getTimeToNextTrading(date: Date = new Date()): number {
  // 如果当前就在交易时间内，返回0
  if (isTradingTime(date)) {
    return 0;
  }

  const currentTime = date.getTime();
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  // 检查今天是否还有交易时段
  if (isTradingDay(date)) {
    for (const session of TRADING_SESSIONS) {
      const [startHour, startMinute] = session.startTime.split(':').map(Number);
      const startTime = startHour * 60 + startMinute;

      if (currentMinutes < startTime) {
        // 今天还有交易时段
        const sessionTime = new Date(date);
        sessionTime.setHours(startHour, startMinute, 0, 0);
        return Math.floor((sessionTime.getTime() - currentTime) / 1000);
      }
    }
  }

  // 今天没有交易时段了，查找下一个交易日
  const nextTradingDay = findNextTradingDay(date);
  const nextSession = TRADING_SESSIONS[0]; // 第一个交易时段
  const [startHour, startMinute] = nextSession.startTime.split(':').map(Number);

  const nextTime = new Date(nextTradingDay);
  nextTime.setHours(startHour, startMinute, 0, 0);

  return Math.floor((nextTime.getTime() - currentTime) / 1000);
}

/**
 * 查找下一个交易日
 */
export function findNextTradingDay(date: Date = new Date()): Date {
  let nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);

  while (!isTradingDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}

/**
 * 格式化日期为YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化倒计时
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '正在交易';

  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);

  return parts.join('') || '1分钟内';
}

/**
 * 获取交易状态描述
 */
export function getTradingStatus(date: Date = new Date()): {
  isTrading: boolean;
  isTradingDay: boolean;
  currentSession: TradingSession | null;
  countdown: number;
  countdownText: string;
  description: string;
} {
  const trading = isTradingTime(date);
  const tradingDay = isTradingDay(date);
  const session = getCurrentTradingSession(date);
  const countdown = getTimeToNextTrading(date);

  let description = '';
  if (trading) {
    description = `当前为交易时间 - ${session?.name}`;
  } else if (tradingDay) {
    description = `今天是交易日，距离交易开始还有 ${formatCountdown(countdown)}`;
  } else {
    description = `非交易日，距离下一个交易日还有 ${formatCountdown(countdown)}`;
  }

  return {
    isTrading: trading,
    isTradingDay: tradingDay,
    currentSession: session,
    countdown,
    countdownText: formatCountdown(countdown),
    description,
  };
}

/**
 * 获取所有交易时段
 */
export function getAllTradingSessions(): TradingSession[] {
  return [...TRADING_SESSIONS];
}

/**
 * 添加节假日
 */
export function addHoliday(date: Date): void {
  const dateStr = formatDate(date);
  if (!HOLIDAYS.includes(dateStr)) {
    HOLIDAYS.push(dateStr);
  }
}

/**
 * 移除节假日
 */
export function removeHoliday(date: Date): void {
  const dateStr = formatDate(date);
  const index = HOLIDAYS.indexOf(dateStr);
  if (index > -1) {
    HOLIDAYS.splice(index, 1);
  }
}

/**
 * 获取所有节假日
 */
export function getHolidays(): string[] {
  return [...HOLIDAYS];
}

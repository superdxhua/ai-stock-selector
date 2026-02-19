/**
 * 会员套餐配置和积分系统
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// ========================================
// 会员套餐配置
// ========================================

export interface MembershipPackage {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  duration: number;  // 天数，0表示永久
  dailyQuota: number;  // 每日配额，-1表示无限制
  features: string[];
  paymentMethods?: string[];
  pointsCost?: number;  // 积分兑换成本
}

export interface PointRules {
  dailyCheckIn: {
    basePoints: number;
    consecutiveBonus: Record<number, number>;
  };
  inviteFriend: {
    points: number;
  };
  shareToMoments: {
    points: number;
    dailyLimit: number;
  };
  watchAd: {
    points: number;
    dailyLimit: number;
  };
  completeTask: {
    points: number;
  };
}

/**
 * 获取所有会员套餐
 */
export async function getMembershipPackages(): Promise<Record<string, MembershipPackage>> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('system_configs')
    .select('value')
    .eq('key', 'membership_packages')
    .single();
  
  if (error) {
    console.error('获取会员套餐配置失败:', error);
    return {};
  }
  
  return data.value || {};
}

/**
 * 获取单个会员套餐
 */
export async function getMembershipPackage(packageId: string): Promise<MembershipPackage | null> {
  const packages = await getMembershipPackages();
  return packages[packageId] || null;
}

/**
 * 获取积分规则
 */
export async function getPointRules(): Promise<PointRules> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('system_configs')
    .select('value')
    .eq('key', 'point_rules')
    .single();
  
  if (error) {
    console.error('获取积分规则失败:', error);
    return {
      dailyCheckIn: { basePoints: 10, consecutiveBonus: {} },
      inviteFriend: { points: 100 },
      shareToMoments: { points: 20, dailyLimit: 3 },
      watchAd: { points: 30, dailyLimit: 10 },
      completeTask: { points: 50 },
    };
  }
  
  return data.value;
}

// ========================================
// 积分系统
// ========================================

export interface PointRecord {
  id: string;
  userId: string;
  points: number;
  balanceAfter: number;
  reason: string;
  relatedId?: string;
  recordType: 'earn' | 'consume' | 'refund' | 'admin';
  createdAt: Date;
}

/**
 * 增加用户积分
 */
export async function addPoints(
  userId: string,
  points: number,
  reason: string,
  options?: {
    relatedId?: string;
    recordType?: PointRecord['recordType'];
  }
): Promise<number> {
  if (points <= 0) {
    throw new Error('积分必须大于0');
  }
  
  const client = getSupabaseClient();
  
  // 获取用户当前积分
  const { data: user, error: userError } = await client
    .from('users')
    .select('points')
    .eq('id', userId)
    .single();
  
  if (userError || !user) {
    throw new Error('获取用户信息失败');
  }
  
  const currentPoints = user.points || 0;
  const newPoints = currentPoints + points;
  
  // 更新用户积分
  const { error: updateError } = await client
    .from('users')
    .update({ points: newPoints })
    .eq('id', userId);
  
  if (updateError) {
    throw new Error('更新积分失败');
  }
  
  // 记录积分变动
  const { error: recordError } = await client
    .from('point_records')
    .insert({
      user_id: userId,
      points: points,
      balance_after: newPoints,
      reason,
      related_id: options?.relatedId,
      record_type: options?.recordType || 'earn',
    });
  
  if (recordError) {
    console.error('记录积分变动失败:', recordError);
  }
  
  return newPoints;
}

/**
 * 扣除用户积分
 */
export async function deductPoints(
  userId: string,
  points: number,
  reason: string,
  options?: {
    relatedId?: string;
    recordType?: PointRecord['recordType'];
  }
): Promise<number> {
  if (points <= 0) {
    throw new Error('积分必须大于0');
  }
  
  const client = getSupabaseClient();
  
  // 获取用户当前积分
  const { data: user, error: userError } = await client
    .from('users')
    .select('points')
    .eq('id', userId)
    .single();
  
  if (userError || !user) {
    throw new Error('获取用户信息失败');
  }
  
  const currentPoints = user.points || 0;
  
  if (currentPoints < points) {
    throw new Error('积分不足');
  }
  
  const newPoints = currentPoints - points;
  
  // 更新用户积分
  const { error: updateError } = await client
    .from('users')
    .update({ points: newPoints })
    .eq('id', userId);
  
  if (updateError) {
    throw new Error('更新积分失败');
  }
  
  // 记录积分变动
  const { error: recordError } = await client
    .from('point_records')
    .insert({
      user_id: userId,
      points: -points,
      balance_after: newPoints,
      reason,
      related_id: options?.relatedId,
      record_type: options?.recordType || 'consume',
    });
  
  if (recordError) {
    console.error('记录积分变动失败:', recordError);
  }
  
  return newPoints;
}

/**
 * 获取用户积分
 */
export async function getUserPoints(userId: string): Promise<number> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('users')
    .select('points')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    return 0;
  }
  
  return data.points || 0;
}

/**
 * 获取用户积分记录
 */
export async function getUserPointRecords(
  userId: string,
  limit: number = 20
): Promise<PointRecord[]> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('point_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error || !data) {
    return [];
  }
  
  return data.map(record => ({
    id: record.id,
    userId: record.user_id,
    points: record.points,
    balanceAfter: record.balance_after,
    reason: record.reason,
    relatedId: record.related_id,
    recordType: record.record_type,
    createdAt: new Date(record.created_at),
  }));
}

// ========================================
// 会员系统
// ========================================

export interface MembershipInfo {
  level: string;
  expireAt: Date | null;
  isExpired: boolean;
  remainingDays: number;
}

/**
 * 获取用户会员信息
 */
export async function getUserMembership(userId: string): Promise<MembershipInfo> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('users')
    .select('membership_level, membership_expire_at')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    return {
      level: 'free',
      expireAt: null,
      isExpired: true,
      remainingDays: 0,
    };
  }
  
  const level = data.membership_level || 'free';
  const expireAt = data.membership_expire_at ? new Date(data.membership_expire_at) : null;
  const now = new Date();
  
  const isExpired = expireAt ? expireAt < now : level === 'free';
  const remainingDays = expireAt ? Math.ceil((expireAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  return {
    level,
    expireAt,
    isExpired,
    remainingDays,
  };
}

/**
 * 检查用户是否可以执行操作
 */
export async function checkUserQuota(
  userId: string,
  action: 'analyze' | 'advanced_analyze' | 'export'
): Promise<{ allowed: boolean; reason?: string }> {
  const membership = await getUserMembership(userId);
  
  // 免费用户限制
  if (membership.level === 'free') {
    if (action === 'analyze') {
      // 检查每日配额
      // 这里可以添加每日配额检查逻辑
      return { allowed: true };
    } else {
      return { allowed: false, reason: '需要升级会员才能使用此功能' };
    }
  }
  
  // 会员用户无限制
  return { allowed: true };
}

/**
 * 激活会员
 */
export async function activateMembership(
  userId: string,
  packageId: string,
  options?: {
    source?: 'purchase' | 'points' | 'admin';
    orderId?: string;
  }
): Promise<void> {
  const client = getSupabaseClient();
  
  // 获取套餐信息
  const pkg = await getMembershipPackage(packageId);
  
  if (!pkg) {
    throw new Error('套餐不存在');
  }
  
  const now = new Date();
  const membership = await getUserMembership(userId);
  
  // 计算新的过期时间
  let newExpireAt: Date;
  
  if (membership.expireAt && !membership.isExpired) {
    // 如果现有会员未过期，累加时间
    newExpireAt = new Date(membership.expireAt);
    newExpireAt.setDate(newExpireAt.getDate() + pkg.duration);
  } else {
    // 如果已过期或没有会员，从现在开始计算
    newExpireAt = new Date(now);
    newExpireAt.setDate(newExpireAt.getDate() + pkg.duration);
  }
  
  // 确定会员等级
  const newLevel = pkg.id === 'free' ? 'free' : 
                   ['trial', 'weekly'].includes(pkg.id) ? 'silver' :
                   ['monthly'].includes(pkg.id) ? 'gold' : 'platinum';
  
  // 更新用户会员信息
  const { error: updateError } = await client
    .from('users')
    .update({
      membership_level: newLevel,
      membership_expire_at: newExpireAt.toISOString(),
    })
    .eq('id', userId);
  
  if (updateError) {
    throw new Error('激活会员失败');
  }
  
  // 记录会员开通
  const { error: recordError } = await client
    .from('membership_records')
    .insert({
      user_id: userId,
      package_id: pkg.id,
      package_name: pkg.name,
      membership_level: newLevel,
      start_date: now.toISOString(),
      end_date: newExpireAt.toISOString(),
      amount: pkg.price,
      payment_method: options?.source,
      order_id: options?.orderId,
      source: options?.source || 'purchase',
    });
  
  if (recordError) {
    console.error('记录会员开通失败:', recordError);
  }
}

// ========================================
// 签到系统
// ========================================

export interface CheckInResult {
  success: boolean;
  pointsEarned: number;
  consecutiveDays: number;
  bonusPoints: number;
  message: string;
}

/**
 * 用户每日签到
 */
export async function dailyCheckIn(userId: string): Promise<CheckInResult> {
  const client = getSupabaseClient();
  const rules = await getPointRules();
  const today = new Date().toISOString().split('T')[0];
  
  // 检查今天是否已签到
  const { data: existingRecord, error: checkError } = await client
    .from('check_in_records')
    .select('*')
    .eq('user_id', userId)
    .eq('check_in_date', today)
    .single();
  
  if (existingRecord) {
    return {
      success: false,
      pointsEarned: 0,
      consecutiveDays: existingRecord.consecutive_days,
      bonusPoints: 0,
      message: '今日已签到',
    };
  }
  
  // 获取连续签到天数
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const { data: yesterdayRecord } = await client
    .from('check_in_records')
    .select('consecutive_days')
    .eq('user_id', userId)
    .eq('check_in_date', yesterdayStr)
    .single();
  
  let consecutiveDays = yesterdayRecord ? yesterdayRecord.consecutive_days + 1 : 1;
  
  // 计算奖励积分
  let basePoints = rules.dailyCheckIn.basePoints;
  let bonusPoints = 0;
  
  // 连续签到奖励
  if (rules.dailyCheckIn.consecutiveBonus[consecutiveDays]) {
    bonusPoints = rules.dailyCheckIn.consecutiveBonus[consecutiveDays];
  }
  
  const totalPoints = basePoints + bonusPoints;
  
  // 添加积分
  await addPoints(userId, totalPoints, `每日签到（连续${consecutiveDays}天）`);
  
  // 记录签到
  const { error: recordError } = await client
    .from('check_in_records')
    .insert({
      user_id: userId,
      check_in_date: today,
      points_earned: basePoints,
      consecutive_days: consecutiveDays,
      bonus_points: bonusPoints,
    });
  
  if (recordError) {
    console.error('记录签到失败:', recordError);
  }
  
  // 更新用户最后签到日期
  await client
    .from('users')
    .update({ last_check_in_date: today })
    .eq('id', userId);
  
  return {
    success: true,
    pointsEarned: totalPoints,
    consecutiveDays,
    bonusPoints,
    message: `签到成功！获得${totalPoints}积分（基础${basePoints}，奖励${bonusPoints}）`,
  };
}

/**
 * 获取用户签到信息
 */
export async function getUserCheckInInfo(userId: string) {
  const client = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  
  // 检查今天是否已签到
  const { data: todayRecord } = await client
    .from('check_in_records')
    .select('*')
    .eq('user_id', userId)
    .eq('check_in_date', today)
    .single();
  
  // 获取连续签到天数
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const { data: yesterdayRecord } = await client
    .from('check_in_records')
    .select('consecutive_days')
    .eq('user_id', userId)
    .eq('check_in_date', yesterdayStr)
    .single();
  
  const consecutiveDays = yesterdayRecord ? yesterdayRecord.consecutive_days : 0;
  
  return {
    hasCheckedIn: !!todayRecord,
    consecutiveDays,
    pointsEarned: todayRecord?.points_earned + todayRecord?.bonus_points || 0,
  };
}

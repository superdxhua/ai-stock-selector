/**
 * 简化的会员订阅系统
 * 
 * 功能：
 * 1. 会员套餐配置（试用期、7天、30天）
 * 2. 新用户自动激活7天试用期
 * 3. 会员状态检查
 * 4. 会员激活
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// ========================================
// 会员套餐配置
// ========================================

export interface MembershipPackage {
  id: string;
  name: string;
  price: number;
  days: number;
  description: string;
  isTrial?: boolean;
}

export const MEMBERSHIP_PACKAGES: Record<string, MembershipPackage> = {
  trial: {
    id: 'trial',
    name: '7天免费试用',
    price: 0,
    days: 7,
    description: '新用户自动获得7天免费试用',
    isTrial: true,
  },
  weekly: {
    id: 'weekly',
    name: '7天会员',
    price: 15,
    days: 7,
    description: '完整功能，无限制使用',
  },
  monthly: {
    id: 'monthly',
    name: '30天会员',
    price: 30,
    days: 30,
    description: '超值优惠，畅享30天完整功能',
  },
};

/**
 * 获取所有套餐
 */
export function getMembershipPackages(): Record<string, MembershipPackage> {
  return MEMBERSHIP_PACKAGES;
}

/**
 * 根据ID获取套餐
 */
export function getMembershipPackage(packageId: string): MembershipPackage | null {
  return MEMBERSHIP_PACKAGES[packageId] || null;
}

// ========================================
// 会员状态检查
// ========================================

export interface MembershipStatus {
  isMember: boolean;
  level: string;
  expireAt: string | null;
  canViewStrategy: boolean;
  daysLeft: number;
  isTrial: boolean;
}

/**
 * 检查用户会员状态
 */
export async function checkMembershipStatus(userId: string): Promise<MembershipStatus> {
  const client = getSupabaseClient();
  
  const { data: user, error } = await client
    .from('users')
    .select('membership_level, membership_expire_at')
    .eq('id', userId)
    .single();
  
  if (error || !user) {
    return {
      isMember: false,
      level: 'free',
      expireAt: null,
      canViewStrategy: false,
      daysLeft: 0,
      isTrial: false,
    };
  }
  
  const now = new Date();
  const expireAt = user.membership_expire_at ? new Date(user.membership_expire_at) : null;
  const isExpired = expireAt && expireAt < now;
  
  const isMember = user.membership_level !== 'free' && !isExpired;
  const isTrial = user.membership_level === 'trial';
  const canViewStrategy = isMember;
  
  let daysLeft = 0;
  if (expireAt && !isExpired) {
    const diffTime = expireAt.getTime() - now.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  return {
    isMember,
    level: user.membership_level,
    expireAt: user.membership_expire_at,
    canViewStrategy,
    daysLeft,
    isTrial,
  };
}

/**
 * 检查用户是否可以查看策略（马赛克保护）
 */
export async function canViewStrategy(userId: string): Promise<boolean> {
  const status = await checkMembershipStatus(userId);
  return status.canViewStrategy;
}

// ========================================
// 会员激活
// ========================================

/**
 * 激活会员（新用户注册时自动调用）
 */
export async function activateTrialMembership(userId: string): Promise<void> {
  const client = getSupabaseClient();
  
  const now = new Date();
  const expireAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后
  
  // 更新用户会员信息
  const { error: updateError } = await client
    .from('users')
    .update({
      membership_level: 'trial',
      membership_expire_at: expireAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', userId);
  
  if (updateError) {
    throw new Error(`激活试用期失败: ${updateError.message}`);
  }
  
  // 记录会员开通记录
  const { error: recordError } = await client
    .from('membership_records')
    .insert({
      user_id: userId,
      package_id: 'trial',
      package_name: '7天免费试用',
      days: 7,
      start_date: now.toISOString().split('T')[0],
      end_date: expireAt.toISOString().split('T')[0],
      status: 'active',
    });
  
  if (recordError) {
    console.error('记录会员开通记录失败:', recordError);
  }
}

/**
 * 激活付费会员
 */
export async function activateMembership(
  userId: string,
  packageId: string,
  orderId?: string
): Promise<void> {
  const pkg = getMembershipPackage(packageId);
  if (!pkg) {
    throw new Error('套餐不存在');
  }
  
  const client = getSupabaseClient();
  
  // 获取当前用户信息
  const { data: currentUser, error: userError } = await client
    .from('users')
    .select('membership_expire_at')
    .eq('id', userId)
    .single();
  
  if (userError || !currentUser) {
    throw new Error('用户不存在');
  }
  
  // 计算新的过期时间
  const now = new Date();
  let expireAt: Date;
  
  if (currentUser.membership_expire_at) {
    const currentExpireAt = new Date(currentUser.membership_expire_at);
    // 如果当前会员未过期，从过期时间开始计算
    if (currentExpireAt > now) {
      expireAt = new Date(currentExpireAt.getTime() + pkg.days * 24 * 60 * 60 * 1000);
    } else {
      // 如果已过期，从现在开始计算
      expireAt = new Date(now.getTime() + pkg.days * 24 * 60 * 60 * 1000);
    }
  } else {
    // 如果没有过期时间，从现在开始计算
    expireAt = new Date(now.getTime() + pkg.days * 24 * 60 * 60 * 1000);
  }
  
  // 更新用户会员信息
  const { error: updateError } = await client
    .from('users')
    .update({
      membership_level: 'paid',
      membership_expire_at: expireAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', userId);
  
  if (updateError) {
    throw new Error(`激活会员失败: ${updateError.message}`);
  }
  
  // 记录会员开通记录
  const { error: recordError } = await client
    .from('membership_records')
    .insert({
      user_id: userId,
      order_id: orderId,
      package_id: pkg.id,
      package_name: pkg.name,
      days: pkg.days,
      start_date: now.toISOString().split('T')[0],
      end_date: expireAt.toISOString().split('T')[0],
      status: 'active',
    });
  
  if (recordError) {
    console.error('记录会员开通记录失败:', recordError);
  }
}

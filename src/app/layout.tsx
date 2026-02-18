import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '牛股选股智能体 | 扣子编程',
    template: '%s | 牛股选股智能体',
  },
  description:
    '牛股选股智能体 - 基于AI的智能选股系统，提供5日趋势核心、5日容量核心、龙头精选等多种策略，支持实时行情分析、大牛股复盘、股票跟踪和经验学习。',
  keywords: [
    '牛股选股',
    '智能选股',
    '股票筛选',
    '5日趋势',
    '5日容量',
    '龙头精选',
    '股票分析',
    'K线分析',
    '技术指标',
    'MACD',
    'CYC',
    '股票跟踪',
    'T+1',
    'T+3',
    '大牛股',
    '股票复盘',
  ],
  authors: [{ name: 'Coze Code Team', url: 'https://code.coze.cn' }],
  generator: 'Coze Code',
  openGraph: {
    title: '牛股选股智能体 | AI驱动的智能选股系统',
    description:
      '基于AI的牛股选股智能体，提供多种策略筛选、实时行情分析、大牛股复盘、股票跟踪和经验学习功能。',
    url: 'https://code.coze.cn',
    siteName: '牛股选股智能体',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}

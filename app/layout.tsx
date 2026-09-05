import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '随它转 · 选择困难小转盘', description: '输入选项，转动转盘，轻松做个小决定。选项自动暂存。' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f4f5f9' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="zh-CN"><body>{children}</body></html>; }

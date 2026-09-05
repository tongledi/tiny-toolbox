import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: {
    default: '随手工具箱 · 小事，顺手解决',
    template: '%s | 随手工具箱',
  },
  description:
    '手机优先的日常小工具站。无需注册，打开即用，从随机选择转盘开始。',
  icons: { icon: '/favicon.svg' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f4f5f9',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <a className="skip-link" href="#main">
          跳到主要内容
        </a>
        <div className="shell">
          <header className="topbar">
            <a className="brand" href="/" aria-label="随手工具箱首页">
              <span className="brand-mark" aria-hidden="true">
                ↗
              </span>
              随手工具箱
            </a>
            <a className="home-link" href="/">
              全部工具
            </a>
          </header>
          <main id="main">{children}</main>
          <footer className="site-footer">
            <span>用小工具，给生活减点负担。</span>
            <span>TINY TOOLBOX</span>
          </footer>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import DecisionWheel from '@/features/decision-wheel/decision-wheel';
import '@/features/decision-wheel/wheel.css';
export const metadata: Metadata = {
  title: '随它转 · 选择困难转盘',
  description: '输入选项，转动转盘，轻松做个小决定。选项自动暂存在当前浏览器。',
};
export default function WheelPage() {
  return <DecisionWheel />;
}

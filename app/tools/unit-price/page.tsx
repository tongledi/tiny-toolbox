import type { Metadata } from 'next';
import UnitPrice from '@/features/unit-price/unit-price';
import '@/features/unit-price/unit-price.css';
export const metadata: Metadata = {
  title: '单位比价 · 哪个更划算',
  description:
    '输入实付价格、规格和份数，自动换算每千克、每升或每件价格，比较不同包装哪个更划算。',
};
export default function UnitPricePage() {
  return <UnitPrice />;
}

export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: '随机决策' | '时间效率' | '文本处理' | '日常计算';
  href: `/tools/${string}/`;
  symbol: string;
  details: string[];
};

/** Only working tools belong in this catalog. Ideas live in docs/ROADMAP.md. */
export const tools: Tool[] = [
  {
    slug: 'decision-wheel',
    name: '随它转',
    description: '吃什么、去哪儿、先做哪件事？写下选项，转一下就有答案。',
    category: '随机决策',
    href: '/tools/decision-wheel/',
    symbol: '↻',
    details: ['自定义选项', '等概率抽取', '保存多组转盘'],
  },
  {
    slug: 'unit-price',
    name: '单位比价',
    description: '价格、规格、份数填一填，大小包装自动换算，看看哪个更划算。',
    category: '日常计算',
    href: '/tools/unit-price/',
    symbol: '¥',
    details: ['单位换算', '多商品比较', '自动暂存'],
  },
];

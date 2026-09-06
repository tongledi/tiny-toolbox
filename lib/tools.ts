export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: '随机决策' | '时间效率' | '文本处理';
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
];

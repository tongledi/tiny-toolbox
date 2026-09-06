export const MODES = {
  weight: { label: '按重量', base: '千克', units: ['g', 'kg', 'jin'] },
  volume: { label: '按容量', base: '升', units: ['ml', 'l'] },
  count: { label: '按数量', base: '件', units: ['piece'] },
} as const;
export type Mode = keyof typeof MODES;
export const UNITS = {
  g: { label: '克', factor: 0.001 },
  kg: { label: '千克', factor: 1 },
  jin: { label: '斤（500克）', factor: 0.5 },
  ml: { label: '毫升', factor: 0.001 },
  l: { label: '升', factor: 1 },
  piece: { label: '件', factor: 1 },
} as const;
export type Unit = keyof typeof UNITS;
export type Product = {
  id: string;
  name: string;
  price: string;
  size: string;
  packs: string;
  unit: Unit;
};
export type Draft = { mode: Mode; groups: Record<Mode, Product[]> };
export const STORAGE_KEY = 'tiny-toolbox-unit-price-v1';
export function emptyProduct(mode: Mode, id: string): Product {
  return {
    id,
    name: '',
    price: '',
    size: '',
    packs: '1',
    unit: MODES[mode].units[0],
  };
}
export function initialDraft(): Draft {
  return {
    mode: 'weight',
    groups: {
      weight: [emptyProduct('weight', 'a'), emptyProduct('weight', 'b')],
      volume: [emptyProduct('volume', 'a'), emptyProduct('volume', 'b')],
      count: [emptyProduct('count', 'a'), emptyProduct('count', 'b')],
    },
  };
}
export function calculate(
  product: Product,
  mode: Mode,
): { total: number; unitPrice: number } | null {
  if (!(MODES[mode].units as readonly string[]).includes(product.unit))
    return null;
  if (
    !/^\d+(?:\.\d{1,2})?$/.test(product.price.trim()) ||
    !/^\d+(?:\.\d{1,3})?$/.test(product.size.trim()) ||
    !/^\d+$/.test(product.packs.trim())
  )
    return null;
  const price = Number(product.price),
    size = Number(product.size),
    packs = Number(product.packs);
  if (
    price < 0 ||
    price > 1e9 ||
    size <= 0 ||
    size > 1e6 ||
    packs < 1 ||
    packs > 10000 ||
    (mode === 'count' && !Number.isInteger(size))
  )
    return null;
  const total = size * packs * UNITS[product.unit].factor;
  return { total, unitPrice: price / total };
}
export function compare(products: Product[], mode: Mode) {
  const entries = products.flatMap((product, index) => {
    const result = calculate(product, mode);
    return result ? [{ ...result, product, index }] : [];
  });
  const minimum = entries.length
    ? Math.min(...entries.map((entry) => entry.unitPrice))
    : null;
  const winners =
    minimum === null
      ? []
      : entries.filter(
          (entry) =>
            Math.abs(entry.unitPrice - minimum) <=
            Math.max(Number.EPSILON, Math.abs(minimum) * 1e-10),
        );
  const next = entries
    .filter((entry) => !winners.includes(entry))
    .sort((a, b) => a.unitPrice - b.unitPrice)[0];
  const saving =
    next && minimum !== null
      ? ((next.unitPrice - minimum) / next.unitPrice) * 100
      : null;
  return { entries, winners, minimum, saving };
}
export function restoreDraft(raw: string | null): Draft {
  if (raw === null) return initialDraft();
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('Invalid draft');
  const draft = value as Draft;
  if (!Object.hasOwn(MODES, draft.mode) || !draft.groups)
    throw new Error('Invalid mode');
  for (const mode of Object.keys(MODES) as Mode[]) {
    const rows = draft.groups[mode];
    if (
      !Array.isArray(rows) ||
      rows.length < 2 ||
      rows.length > 6 ||
      new Set(rows.map((row) => row?.id)).size !== rows.length ||
      !rows.every(
        (row) =>
          row &&
          typeof row.id === 'string' &&
          typeof row.name === 'string' &&
          row.name.length <= 80 &&
          ['price', 'size', 'packs'].every(
            (key) =>
              typeof row[key as keyof Product] === 'string' &&
              row[key as keyof Product].length <= 20,
          ) &&
          (MODES[mode].units as readonly string[]).includes(row.unit),
      )
    )
      throw new Error('Invalid products');
  }
  return draft;
}
export function money(value: number): string {
  if (value > 0 && value < 0.0001) return value.toExponential(2);
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  });
}

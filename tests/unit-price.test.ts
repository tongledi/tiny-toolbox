import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculate,
  compare,
  emptyProduct,
  initialDraft,
  restoreDraft,
  money,
  type Product,
} from '../features/unit-price/logic.ts';
const item = (patch: Partial<Product> = {}): Product => ({
  ...emptyProduct('weight', 'a'),
  price: '29.90',
  size: '500',
  packs: '3',
  ...patch,
});
void test('compares the actual paid total against all packs and reports savings relative to the more expensive unit price', () => {
  const a = item(),
    b = item({ id: 'b', price: '39.90', size: '800', packs: '2' });
  assert.equal(calculate(a, 'weight')?.total, 1.5);
  const result = compare([a, b], 'weight');
  assert.equal(result.winners[0].product.id, 'a');
  assert.ok(Math.abs(result.saving! - 20.066833751) < 0.00001);
});
void test('normalizes kilograms, grams and Chinese jin; milliliters and liters', () => {
  const weight = compare(
    [
      item({ price: '10', size: '500', packs: '1' }),
      item({ id: 'b', price: '20', size: '1', unit: 'kg', packs: '1' }),
      item({ id: 'c', price: '10', size: '1', unit: 'jin', packs: '1' }),
    ],
    'weight',
  );
  assert.equal(weight.winners.length, 3);
  assert.equal(weight.saving, null);
  const volume = compare(
    [
      item({ unit: 'ml', price: '3', size: '250', packs: '4' }),
      item({ id: 'b', unit: 'l', price: '3', size: '1', packs: '1' }),
    ],
    'volume',
  );
  assert.equal(volume.winners.length, 2);
  assert.equal(volume.minimum, 3);
  assert.equal(calculate(item({ unit: 'ml' }), 'weight'), null);
});
void test('counts per-piece prices with integer pack sizes', () => {
  assert.equal(
    calculate(
      item({ price: '24', unit: 'piece', size: '10', packs: '3' }),
      'count',
    )?.unitPrice,
    0.8,
  );
  assert.equal(calculate(item({ unit: 'piece', size: '1.5' }), 'count'), null);
});
void test('zero-price offers and incomplete products do not create invalid percentages or false totals', () => {
  const result = compare(
    [item({ price: '0' }), item({ id: 'b' }), emptyProduct('weight', 'c')],
    'weight',
  );
  assert.equal(result.entries.length, 2);
  assert.equal(result.minimum, 0);
  assert.equal(result.saving, 100);
  assert.equal(
    compare([item({ price: '0' }), item({ id: 'b', price: '0' })], 'weight')
      .saving,
    null,
  );
});
void test('rejects invalid quantities, negative prices, exponent syntax and out-of-range input', () => {
  for (const patch of [
    { price: '' },
    { price: '-1' },
    { price: '1e3' },
    { price: '2.345' },
    { price: '1000000001' },
    { size: '0' },
    { size: '1e2' },
    { size: '1.0001' },
    { size: '1000001' },
    { packs: '0' },
    { packs: '1.5' },
    { packs: '10001' },
  ])
    assert.equal(calculate(item(patch), 'weight'), null, JSON.stringify(patch));
});
void test('preserves separate category drafts and validates persisted input without requiring finished forms', () => {
  const draft = initialDraft();
  draft.groups.weight[0] = item();
  draft.groups.volume[0] = {
    ...emptyProduct('volume', 'a'),
    price: 'unfinished',
  };
  draft.mode = 'volume';
  assert.deepEqual(restoreDraft(JSON.stringify(draft)), draft);
  assert.deepEqual(restoreDraft(null), initialDraft());
  assert.throws(() => restoreDraft('{bad'));
  assert.throws(() =>
    restoreDraft(JSON.stringify({ ...draft, mode: 'invalid' })),
  );
  assert.throws(() =>
    restoreDraft(
      JSON.stringify({
        ...draft,
        groups: { ...draft.groups, weight: [item()] },
      }),
    ),
  );
});
void test('display never rounds a small positive unit price down to zero', () => {
  assert.equal(money(0), '0.00');
  assert.notEqual(money(0.00000001), '0.00');
});

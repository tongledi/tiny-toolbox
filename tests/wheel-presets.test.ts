import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PRESETS,
  PRESETS_KEY,
  readPresets,
  savePreset,
  removePreset,
  type WheelPreset,
} from '../features/decision-wheel/presets.ts';
function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
const meal: WheelPreset = {
  id: 'meal',
  name: '吃什么',
  options: ['火锅', '日料'],
};
void test('multiple named wheels survive reload, including same-name independent wheels', () => {
  const storage = memoryStorage();
  savePreset(storage, meal);
  savePreset(storage, { ...meal, id: 'other', options: ['烧烤', '面条'] });
  assert.deepEqual(
    readPresets(storage).map((item) => item.id),
    ['other', 'meal'],
  );
  assert.deepEqual(
    readPresets(storage).find((item) => item.id === 'meal')?.options,
    meal.options,
  );
});
void test('updates target by id and preserves other wheels written by another tab', () => {
  const storage = memoryStorage();
  savePreset(storage, meal);
  savePreset(storage, { id: 'drink', name: '喝什么', options: ['茶', '咖啡'] });
  const next = savePreset(
    storage,
    { ...meal, name: '晚饭', options: ['饺子', '面条'] },
    true,
  );
  assert.equal(next.length, 2);
  assert.equal(next.find((item) => item.id === 'meal')?.name, '晚饭');
  assert.equal(next.find((item) => item.id === 'drink')?.name, '喝什么');
  assert.throws(() => savePreset(storage, { ...meal, id: 'missing' }, true));
});
void test('deletion can be undone without losing other wheels', () => {
  const storage = memoryStorage();
  savePreset(storage, meal);
  assert.deepEqual(removePreset(storage, meal.id), []);
  savePreset(storage, meal);
  assert.deepEqual(readPresets(storage), [meal]);
});
void test('invalid new input or malformed saved data never replaces existing storage', () => {
  const storage = memoryStorage();
  savePreset(storage, meal);
  const raw = storage.getItem(PRESETS_KEY);
  for (const invalid of [
    { ...meal, name: ' ' },
    { ...meal, options: ['one'] },
    { ...meal, name: '字'.repeat(31) },
  ]) {
    assert.throws(() => savePreset(storage, invalid));
    assert.equal(storage.getItem(PRESETS_KEY), raw);
  }
  for (const bad of [
    '{bad json',
    '{}',
    '[{"id":"x"}]',
    JSON.stringify([meal, meal]),
  ]) {
    storage.setItem(PRESETS_KEY, bad);
    assert.throws(() => readPresets(storage));
    assert.throws(() => savePreset(storage, meal));
    assert.equal(storage.getItem(PRESETS_KEY), bad);
  }
});
void test('full collections allow updates; storage failures do not report success', () => {
  const storage = memoryStorage();
  for (let i = 0; i < MAX_PRESETS; i++)
    savePreset(storage, { ...meal, id: String(i) });
  assert.throws(() => savePreset(storage, meal));
  assert.equal(
    savePreset(storage, { ...meal, id: '0', name: '新名字' }, true).length,
    MAX_PRESETS,
  );
  const before = storage.getItem(PRESETS_KEY);
  const unavailable = {
    getItem: storage.getItem,
    setItem: () => {
      throw new Error('QuotaExceeded');
    },
  };
  assert.throws(() => removePreset(unavailable, '0'));
  assert.equal(storage.getItem(PRESETS_KEY), before);
});

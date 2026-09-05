import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseOptions,
  validOptions,
  randomIndex,
  nextRotation,
} from '../features/decision-wheel/logic.ts';

void test('handles pasted blank lines and CRLF while preserving deliberate duplicate slots', () => {
  assert.deepEqual(parseOptions('  火锅\r\n \r\n日料\r\n火锅 '), [
    '火锅',
    '日料',
    '火锅',
  ]);
});
void test('enforces option limits, including Unicode characters and blank entries', () => {
  assert.equal(validOptions([]), false);
  assert.equal(validOptions(['one']), false);
  assert.equal(validOptions(['one', '  ']), false);
  assert.equal(validOptions(['😀'.repeat(40), 'two']), true);
  assert.equal(validOptions(['😀'.repeat(41), 'two']), false);
  assert.equal(validOptions(Array(24).fill('item')), true);
  assert.equal(validOptions(Array(25).fill('item')), false);
});
void test('rejects biased tail values before selecting an option', () => {
  const words = [4294967295, 4294967294, 5];
  assert.equal(
    randomIndex(6, () => words.shift()!),
    5,
  );
  assert.equal(words.length, 0);
  assert.equal(
    randomIndex(2, () => 4294967295),
    1,
  );
  assert.throws(() => randomIndex(0), RangeError);
});
void test('fixed top pointer lands in the requested sector over repeated spins for every supported wheel size', () => {
  for (let count = 2; count <= 24; count++) {
    let current = 0;
    for (let round = 0; round < 3; round++) {
      for (let winner = 0; winner < count; winner++) {
        const next = nextRotation(current, winner, count);
        assert.ok(next - current >= 6 * 360 - 1e-8);
        const positionUnderPointer = (360 - (next % 360) + 360) % 360;
        assert.equal(Math.floor(positionUnderPointer / (360 / count)), winner);
        current = next;
      }
    }
  }
  assert.throws(() => nextRotation(0, 2, 2), RangeError);
});

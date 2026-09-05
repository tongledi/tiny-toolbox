/** Empty lines are ignored; repeated options remain independent equal-weight slots. */
export const parseOptions = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

export const validOptions = (items: string[]): boolean =>
  items.length >= 2 &&
  items.length <= 24 &&
  items.every(
    (value) => value.trim().length > 0 && Array.from(value).length <= 40,
  );

/** Rejection sampling avoids modulo bias. Injectable entropy supports deterministic tests. */
export function randomIndex(
  count: number,
  nextWord = (): number => {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0];
  },
): number {
  if (!Number.isInteger(count) || count < 2 || count > 24)
    throw new RangeError('Expected 2–24 options');
  const limit = Math.floor(4294967296 / count) * count;
  let value: number;
  do {
    value = nextWord();
  } while (value >= limit);
  return value % count;
}

/** The fixed pointer sits at 12 o'clock and stops in the selected sector's center. */
export function nextRotation(
  current: number,
  winner: number,
  count: number,
): number {
  if (
    !Number.isFinite(current) ||
    !Number.isInteger(count) ||
    count < 2 ||
    count > 24 ||
    !Number.isInteger(winner) ||
    winner < 0 ||
    winner >= count
  )
    throw new RangeError('Invalid wheel state');
  const target = (360 - (winner + 0.5) * (360 / count)) % 360;
  const normalized = ((current % 360) + 360) % 360;
  return current + 360 * 6 + ((target - normalized + 360) % 360);
}

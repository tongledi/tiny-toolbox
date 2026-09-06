import { validOptions } from './logic.ts';

export const PRESETS_KEY = 'just-spin-presets-v1';
export const MAX_PRESETS = 30;
export type WheelPreset = { id: string; name: string; options: string[] };
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

function isPreset(value: unknown): value is WheelPreset {
  if (!value || typeof value !== 'object') return false;
  const item = value as WheelPreset;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    Array.from(item.name).length <= 30 &&
    Array.isArray(item.options) &&
    item.options.every((option) => typeof option === 'string') &&
    validOptions(item.options)
  );
}

/** Refuse malformed data instead of overwriting someone's saved collection. */
export function readPresets(storage: StoragePort): WheelPreset[] {
  const raw = storage.getItem(PRESETS_KEY);
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (
    !Array.isArray(value) ||
    value.length > MAX_PRESETS ||
    !value.every(isPreset) ||
    new Set(value.map((item) => item.id)).size !== value.length
  ) {
    throw new Error('保存的转盘数据无法读取，原数据未改动。');
  }
  return value;
}

/** Read the latest collection before each edit so independent tabs do not lose unrelated sets. */
export function savePreset(
  storage: StoragePort,
  preset: WheelPreset,
  update = false,
): WheelPreset[] {
  if (!isPreset(preset))
    throw new Error('请输入名称（最多 30 字）和 2–24 个有效选项。');
  const previous = readPresets(storage);
  const index = previous.findIndex((item) => item.id === preset.id);
  if (update && index < 0) throw new Error('这组转盘已被删除，请存为新转盘。');
  if (!update && index >= 0) throw new Error('转盘标识重复，请重试。');
  if (!update && previous.length >= MAX_PRESETS)
    throw new Error(`最多保存 ${MAX_PRESETS} 组，请先删除不再使用的转盘。`);
  const next = update
    ? previous.map((item) => (item.id === preset.id ? preset : item))
    : [preset, ...previous];
  storage.setItem(PRESETS_KEY, JSON.stringify(next));
  return next;
}

export function removePreset(storage: StoragePort, id: string): WheelPreset[] {
  const next = readPresets(storage).filter((item) => item.id !== id);
  storage.setItem(PRESETS_KEY, JSON.stringify(next));
  return next;
}

/** Suggest the first unused numbered name, independent of the last opened wheel. */
export function nextPresetName(presets: WheelPreset[]): string {
  const names = new Set(presets.map((preset) => preset.name.trim()));
  let number = 1;
  while (names.has(`转盘${number}`)) number++;
  return `转盘${number}`;
}

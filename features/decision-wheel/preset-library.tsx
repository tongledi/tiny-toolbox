'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MAX_PRESETS,
  PRESETS_KEY,
  readPresets,
  removePreset,
  savePreset,
  type WheelPreset,
} from './presets';

type Props = {
  options: string[];
  disabled: boolean;
  onLoad: (preset: WheelPreset) => void;
};

export default function PresetLibrary({ options, disabled, onLoad }: Props) {
  const [presets, setPresets] = useState<WheelPreset[]>([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleted, setDeleted] = useState<WheelPreset | null>(null);
  useEffect(() => {
    function restore() {
      try {
        setPresets(readPresets(localStorage));
        setError('');
      } catch {
        setError('无法读取已存转盘。浏览器可能限制了存储，原数据未改动。');
      }
      setReady(true);
    }
    restore();
    const sync = (event: StorageEvent) => {
      if (event.key === PRESETS_KEY || event.key === null) restore();
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const locked = disabled || !ready;
  const selected = presets.find((item) => item.id === selectedId);
  function reportFailure(reason: unknown) {
    setMessage('');
    setError(
      reason instanceof Error &&
        !(reason instanceof DOMException) &&
        !(reason instanceof SyntaxError)
        ? reason.message
        : '未能保存更改。浏览器存储不可用或已满，请不要关闭当前页面。',
    );
  }
  function save(update: boolean) {
    if (locked) return;
    try {
      const id =
        update && selected
          ? selected.id
          : Array.from(crypto.getRandomValues(new Uint32Array(4)), (word) =>
              word.toString(16).padStart(8, '0'),
            ).join('');
      const preset = { id, name: name.trim(), options: [...options] };
      const next = savePreset(localStorage, preset, update);
      setPresets(next);
      setSelectedId(id);
      setName(preset.name);
      setError('');
      setMessage(`已${update ? '更新' : '保存'}「${preset.name}」`);
    } catch (reason) {
      reportFailure(reason);
    }
  }
  function load(preset: WheelPreset) {
    if (locked) return;
    onLoad(preset);
    setSelectedId(preset.id);
    setName(preset.name);
    setError('');
    setMessage(`已载入「${preset.name}」，可以直接转动。`);
  }
  function remove(preset: WheelPreset) {
    if (locked) return;
    try {
      setPresets(removePreset(localStorage, preset.id));
      setDeleted(preset);
      if (selectedId === preset.id) setSelectedId(null);
      setError('');
      setMessage(`已删除「${preset.name}」`);
    } catch (reason) {
      reportFailure(reason);
    }
  }
  function undo() {
    if (locked || !deleted) return;
    try {
      setPresets(savePreset(localStorage, deleted));
      setMessage(`已恢复「${deleted.name}」`);
      setDeleted(null);
      setError('');
    } catch (reason) {
      reportFailure(reason);
    }
  }
  return (
    <section className="preset-library" aria-labelledby="presets-title">
      <div className="preset-heading">
        <h2 id="presets-title">
          我的转盘{' '}
          <span>
            {presets.length}/{MAX_PRESETS}
          </span>
        </h2>
        <p>保存常用选项，下次直接选用。</p>
      </div>
      {presets.length > 0 ? (
        <ul className="preset-list" aria-label="已保存的转盘">
          {presets.map((preset) => (
            <li
              key={preset.id}
              className={selectedId === preset.id ? 'is-selected' : ''}
            >
              <Button
                variant="ghost"
                className="preset-load"
                disabled={locked}
                onClick={() => load(preset)}
                aria-label={`载入${preset.name}，${preset.options.length}个选项`}
              >
                <span>{preset.name}</span>
                <small>
                  {preset.options.length} 个选项 ·{' '}
                  {selectedId === preset.id ? '再次载入' : '点击载入'}
                </small>
              </Button>
              <Button
                variant="ghost"
                className="preset-delete"
                disabled={locked}
                onClick={() => remove(preset)}
                aria-label={`删除转盘${preset.name}`}
                title="删除"
              >
                ×
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="preset-empty">
          {ready
            ? '还没有保存的转盘。填好下面的选项，取个名字就能保存。'
            : '正在读取已保存的转盘…'}
        </p>
      )}
      <form
        className="preset-form"
        onSubmit={(event) => {
          event.preventDefault();
          save(false);
        }}
      >
        <div className="preset-name-field">
          <label htmlFor="preset-name">转盘名称</label>
          <Input
            id="preset-name"
            className="preset-name"
            value={name}
            disabled={locked}
            maxLength={60}
            placeholder="例如：午饭吃什么"
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <Button type="submit" className="preset-save" disabled={locked}>
          存为新转盘
        </Button>
        {selected && (
          <Button
            type="button"
            variant="outline"
            className="preset-update"
            disabled={locked}
            onClick={() => save(true)}
          >
            更新这组
          </Button>
        )}
      </form>
      <div className="preset-feedback">
        <output aria-live="polite">{message}</output>
        {deleted && (
          <Button
            variant="ghost"
            className="preset-undo"
            disabled={locked}
            onClick={undo}
          >
            撤销删除「{deleted.name}」
          </Button>
        )}
      </div>
      {error && (
        <p className="preset-error" role="alert">
          {error}
        </p>
      )}
      <p className="preset-help">
        保存的是下方输入框里的选项。
        {selected
          ? `正在编辑「${selected.name}」，修改后点“更新这组”保存。`
          : '同名转盘会另存，不会覆盖。'}{' '}
        仅保存在此浏览器，清除网站数据后会丢失。
      </p>
    </section>
  );
}

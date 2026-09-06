'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  MAX_PRESETS,
  PRESETS_KEY,
  nextPresetName,
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
  const [suggestedName, setSuggestedName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'new' | 'update'>('new');
  const [saveOpen, setSaveOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
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
  function openSave() {
    if (locked) return;
    try {
      const latest = readPresets(localStorage);
      const suggestion = nextPresetName(latest);
      setPresets(latest);
      setMode('new');
      setName(suggestion);
      setSuggestedName(suggestion);
      setError('');
      setSaveOpen(true);
    } catch (reason) {
      reportFailure(reason);
    }
  }
  function changeMode(value: unknown) {
    if (value === 'update' && selected) {
      setMode('update');
      setName(selected.name);
    } else {
      setMode('new');
      const suggestion = nextPresetName(presets);
      setName(suggestion);
      setSuggestedName(suggestion);
    }
    setError('');
  }
  function save() {
    if (locked) return;
    try {
      const latest = readPresets(localStorage);
      const update = mode === 'update';
      if (update && !selected)
        throw new Error('这组转盘已被删除，请选择“存为新转盘”。');
      const id =
        update && selected
          ? selected.id
          : Array.from(crypto.getRandomValues(new Uint32Array(4)), (word) =>
              word.toString(16).padStart(8, '0'),
            ).join('');
      // Refresh untouched suggestions at submission in case another tab used the number.
      const finalName =
        !update && (!name.trim() || name.trim() === suggestedName)
          ? nextPresetName(latest)
          : name.trim() || selected?.name || nextPresetName(latest);
      const preset = { id, name: finalName, options: [...options] };
      setPresets(savePreset(localStorage, preset, update));
      setSelectedId(id);
      setError('');
      setSaveOpen(false);
      setMessage(`已${update ? '更新' : '保存'}「${preset.name}」`);
    } catch (reason) {
      reportFailure(reason);
    }
  }
  function load(preset: WheelPreset) {
    if (locked) return;
    onLoad(preset);
    setSelectedId(preset.id);
    setError('');
    setMessage(`已载入「${preset.name}」`);
    setListOpen(false);
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
    <div className="preset-controls">
      <div className="preset-toolbar">
        <Button
          variant="ghost"
          className="preset-toolbar-button"
          disabled={locked}
          onClick={openSave}
        >
          保存转盘
        </Button>
        <Button
          variant="ghost"
          className="preset-toolbar-button"
          disabled={locked}
          onClick={() => {
            setError('');
            setListOpen(true);
          }}
        >
          我的转盘 <span className="preset-badge">{presets.length}</span>
        </Button>
      </div>
      <output className="preset-status" aria-live="polite">
        {!saveOpen && !listOpen ? message : ''}
      </output>
      {!saveOpen && !listOpen && error && (
        <p className="preset-inline-error" role="alert">
          {error}
        </p>
      )}

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="preset-dialog" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>保存转盘</DialogTitle>
            <DialogDescription>
              保存输入框中的 {options.length} 个选项，之后一键载入。
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            render={
              <Button
                variant="ghost"
                className="preset-popup-close"
                aria-label="关闭保存窗口"
              />
            }
          >
            ×
          </DialogClose>
          <form
            className="preset-save-form"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            {selected && (
              <RadioGroup
                className="preset-mode"
                value={mode}
                onValueChange={changeMode}
                aria-label="保存方式"
              >
                <label htmlFor="preset-mode-new">
                  <RadioGroupItem id="preset-mode-new" value="new" />
                  存为新转盘
                </label>
                <label htmlFor="preset-mode-update">
                  <RadioGroupItem id="preset-mode-update" value="update" />
                  <span>更新「{selected.name}」</span>
                </label>
              </RadioGroup>
            )}
            <label htmlFor="preset-name" className="preset-name-label">
              转盘名称
            </label>
            <Input
              id="preset-name"
              className="preset-name"
              value={name}
              disabled={locked}
              maxLength={60}
              placeholder={suggestedName}
              onChange={(event) => setName(event.target.value)}
            />
            <p className="preset-hint">
              {mode === 'new'
                ? '已自动取好名字，也可以改成“午饭吃什么”。'
                : '将更新这组的名称和选项，其他转盘不受影响。'}
            </p>
            {error && (
              <p className="preset-popup-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="preset-confirm" disabled={locked}>
              {mode === 'new' ? '保存新转盘' : '确认更新'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent className="preset-sheet" showCloseButton={false}>
          <SheetHeader className="preset-sheet-heading">
            <SheetTitle>
              我的转盘{' '}
              <span>
                {presets.length}/{MAX_PRESETS}
              </span>
            </SheetTitle>
            <SheetDescription>点选一组，载入后立即回到转盘。</SheetDescription>
          </SheetHeader>
          <SheetClose
            render={
              <Button
                variant="ghost"
                className="preset-popup-close"
                aria-label="关闭我的转盘"
              />
            }
          >
            ×
          </SheetClose>
          <div className="preset-sheet-body">
            {presets.length ? (
              <ul className="preset-list">
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
                      <strong>{preset.name}</strong>
                      <small>
                        {preset.options.length} 个选项
                        {selectedId === preset.id ? ' · 当前这组' : ''}
                      </small>
                      <span className="preset-preview">
                        {preset.options.join('、')}
                      </span>
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
                还没有保存的转盘。回到选项区，点“保存转盘”就能存下第一组。
              </p>
            )}
            <output className="preset-sheet-status" aria-live="polite">
              {message}
            </output>
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
            {error && (
              <p className="preset-popup-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <p className="preset-storage-note">
            仅保存在此浏览器。清除网站数据后会丢失。
          </p>
        </SheetContent>
      </Sheet>
    </div>
  );
}

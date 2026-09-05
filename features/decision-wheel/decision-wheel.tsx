'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  parseOptions as parse,
  validOptions as valid,
  randomIndex,
  nextRotation,
} from './logic';

const KEY = 'just-spin-options-v1';
const INITIAL = '火锅\n日料\n烧烤\n意大利面\n川菜\n听你的';
const COLORS = [
  '#ffc938',
  '#8474f7',
  '#ff8b63',
  '#69d8c0',
  '#94bdff',
  '#f5a5d0',
];
const point = (angle: number) => [
  200 + 190 * Math.cos((angle * Math.PI) / 180),
  200 + 190 * Math.sin((angle * Math.PI) / 180),
];

export default function DecisionWheel() {
  const [draft, setDraft] = useState(INITIAL);
  const [options, setOptions] = useState(parse(INITIAL));
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(4800);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const finish = useRef<(() => void) | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored !== null) {
        // eslint-disable-next-line react/react-compiler -- Restore browser storage after hydration, preserving server markup.
        setDraft(stored);
        const items = parse(stored);
        setOptions(valid(items) ? items : []);
      }
    } catch {
      setSaved(false);
    }
    setReady(true);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, draft);
      // eslint-disable-next-line react/react-compiler -- Reflect whether synchronization with localStorage succeeded.
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [draft, ready]);
  const items = parse(draft);
  const dirty = JSON.stringify(items) !== JSON.stringify(options);
  function generate() {
    if (busy.current) return;
    if (!valid(items)) {
      setError('请输入 2–24 个选项，每个不超过 40 个字。');
      return;
    }
    setOptions(items);
    setRotation(0);
    setResult('');
    setError('');
  }
  function spin() {
    if (busy.current || dirty || !valid(options) || !ready) return;
    busy.current = true;
    const winner = randomIndex(options.length);
    const ms = matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 150
      : 4800;
    setDuration(ms);
    setSpinning(true);
    setResult('');
    setRotation(nextRotation(rotation, winner, options.length));
    finish.current = () => {
      if (!busy.current) return;
      busy.current = false;
      if (timer.current) clearTimeout(timer.current);
      setResult(options[winner]);
      setSpinning(false);
    };
    timer.current = setTimeout(() => finish.current?.(), ms + 120);
  }
  const agentAction = useRef<() => void>(() => {});
  useEffect(() => {
    agentAction.current = () => {
      if (!ready || busy.current || dirty || !valid(options))
        throw new Error('请先输入有效选项并生成转盘，且等待当前转动结束。');
      spin();
    };
  });
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => unknown;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'start_wheel_spin',
            title: '开始转动转盘',
            description:
              '使用页面已生成的选项开始随机转动。返回 started 表示已启动，最终结果会在动画结束后显示在页面。',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            async execute(input: unknown) {
              if (
                !input ||
                typeof input !== 'object' ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error('参数必须为空对象。');
              agentAction.current();
              await new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              );
              return { status: 'started' };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Standard is optional on current browsers. */
    }
    return () => lifecycle.abort();
  }, []);
  return (
    <div className="wheel-tool">
      <nav className="breadcrumb" aria-label="面包屑">
        <a href="/">全部工具</a>
        <span aria-hidden="true">/</span>
        <span>随它转</span>
      </nav>
      <div className="intro">
        <span className="eyebrow">JUST SPIN IT</span>
        <h1>
          选不出来？
          <br className="mobile-break" /> 转一下。
        </h1>
        <p>写下选项，把这一刻交给运气。</p>
      </div>
      <div className="workspace">
        <section className="wheel-panel" aria-label="随机选择转盘">
          <div className="wheel-heading">
            <span className="tiny-dot" /> 每个选项，机会均等{' '}
            <span className="count">{options.length} 个选项</span>
          </div>
          <div className="wheel-wrap">
            <div className="pointer" aria-hidden="true" />
            <svg
              className="wheel"
              viewBox="0 0 400 400"
              // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- The wheel is an SVG diagram, not a raster image.
              role="img"
              aria-label={
                options.length ? `转盘：${options.join('、')}` : '请先生成转盘'
              }
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? `transform ${duration}ms cubic-bezier(.12,.74,.13,1)`
                  : 'none',
              }}
              onTransitionEnd={(e) => {
                if (e.propertyName === 'transform') finish.current?.();
              }}
            >
              <circle cx="200" cy="200" r="196" fill="#fff" />
              {options.map((option, i) => {
                const start = -90 + (i * 360) / options.length;
                const end = -90 + ((i + 1) * 360) / options.length;
                const mid = (start + end) / 2;
                const p1 = point(start),
                  p2 = point(end);
                const short =
                  Array.from(option)
                    .slice(0, options.length > 12 ? 5 : 8)
                    .join('') +
                  (Array.from(option).length > (options.length > 12 ? 5 : 8)
                    ? '…'
                    : '');
                return (
                  <g key={i}>
                    <path
                      d={`M 200 200 L ${p1.join(' ')} A 190 190 0 0 1 ${p2.join(' ')} Z`}
                      fill={COLORS[i % COLORS.length]}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <text
                      transform={`translate(200 200) rotate(${mid})`}
                      x="174"
                      y="5"
                      textAnchor="end"
                      fill="#242337"
                      fontSize={options.length > 12 ? 12 : 15}
                      fontWeight="700"
                    >
                      {short}
                    </text>
                  </g>
                );
              })}
              {!options.length && (
                <circle cx="200" cy="200" r="190" fill="#e9e9f3" />
              )}
            </svg>
            <Button
              className="hub"
              onClick={spin}
              disabled={!ready || spinning || dirty || !valid(options)}
              aria-label="转动转盘"
            >
              {spinning ? '···' : '转'}
            </Button>
          </div>
          <output
            className={`result ${result ? 'has-result' : ''}`}
            aria-live="polite"
          >
            <span>
              {spinning
                ? '好运正在转过来…'
                : result
                  ? '这次就选'
                  : dirty
                    ? '选项变了，先生成新转盘'
                    : '准备好了，就转一下'}
            </span>
            <strong>
              {result || (spinning ? '再等一下下' : '让转盘替你选')}
            </strong>
          </output>
          <Button
            className="spin-button"
            onClick={spin}
            disabled={!ready || spinning || dirty || !valid(options)}
          >
            <span aria-hidden="true">↻</span>{' '}
            {spinning ? '转动中…' : result ? '再转一次' : '开始转动'}
          </Button>
        </section>
        <section className="editor-panel" aria-labelledby="editor-title">
          <div className="editor-heading">
            <div>
              <span className="eyebrow">YOUR CHOICES</span>
              <h2 id="editor-title">有哪些选择？</h2>
            </div>
            <span className="step">01 — 02</span>
          </div>
          <label htmlFor="options">每行一个选项</label>
          <Textarea
            id="options"
            className="options-input"
            value={draft}
            disabled={!ready || spinning}
            maxLength={4000}
            onChange={(e) => {
              setDraft(e.target.value);
              setError('');
              setResult('');
            }}
            spellCheck={false}
            placeholder={'比如：\n喝咖啡\n喝奶茶\n喝白开水'}
            aria-describedby="input-help input-error"
          />
          <div id="input-help" className="input-meta">
            <span>2–24 项 · 每项最多 40 字</span>
            <span>{items.length} 项</span>
          </div>
          <p id="input-error" className="error" role="alert">
            {error}
          </p>
          <Button
            className="generate-button"
            disabled={!ready || spinning}
            onClick={generate}
          >
            {dirty || !options.length ? '生成转盘' : '更新转盘'}{' '}
            <span aria-hidden="true">↗</span>
          </Button>
          <div className="save-note">
            <span className="save-dot" />
            {!ready
              ? '正在读取暂存…'
              : saved
                ? '选项已自动暂存在此浏览器'
                : '浏览器无法暂存，请先不要关闭页面'}
          </div>
          <p className="editor-footnote">
            刷新也不怕丢。换个浏览器或设备，选项不会同步。
          </p>
        </section>
      </div>
    </div>
  );
}

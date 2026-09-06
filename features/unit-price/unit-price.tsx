'use client';
import { useEffect, useState } from 'react';
import { sitePath } from '@/lib/site-path';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  MODES,
  UNITS,
  STORAGE_KEY,
  initialDraft,
  emptyProduct,
  restoreDraft,
  compare,
  calculate,
  money,
  type Mode,
  type Unit,
  type Product,
} from './logic';

export default function UnitPrice() {
  const [draft, setDraft] = useState(initialDraft);
  const [ready, setReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState('');
  const [removed, setRemoved] = useState<{
    product: Product;
    mode: Mode;
    index: number;
  } | null>(null);
  useEffect(() => {
    try {
      // eslint-disable-next-line react/react-compiler -- Restore the device-local draft after hydration.
      setDraft(restoreDraft(localStorage.getItem(STORAGE_KEY)));
    } catch {
      setStorageMessage('旧暂存无法读取，可以重新输入。');
    }
    setReady(true);
  }, []);
  function persist(next: typeof draft) {
    setDraft(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageMessage('已自动暂存在此浏览器');
    } catch {
      setStorageMessage('浏览器无法暂存，请先不要关闭页面');
    }
  }
  const mode = draft.mode,
    rows = draft.groups[mode],
    results = compare(rows, mode);
  function replaceRows(next: Product[]) {
    persist({ ...draft, groups: { ...draft.groups, [mode]: next } });
  }
  function edit(id: string, key: keyof Product, value: string) {
    replaceRows(
      rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  }
  const nameOf = (product: Product, index: number) =>
    product.name.trim() || `商品${String.fromCharCode(65 + index)}`;
  const winnerNames = results.winners.map((entry) =>
    nameOf(entry.product, entry.index),
  );
  const compared = results.entries.length;
  function percentage(value: number) {
    return value > 0 && value < 0.01
      ? '不足 0.01%'
      : `${value.toFixed(2).replace(/\.00$/, '')}%`;
  }
  return (
    <div className="unit-tool">
      <nav className="unit-breadcrumb" aria-label="面包屑">
        <a href={sitePath('/')}>全部工具</a>
        <span>/</span>
        <span>单位比价</span>
      </nav>
      <div className="unit-intro">
        <span className="eyebrow">PRICE PER UNIT</span>
        <h1>大小包装，算清再买。</h1>
        <p>填实付总价、每份规格和份数，自动比较单位价格。</p>
      </div>
      <RadioGroup
        value={mode}
        onValueChange={(value) => {
          if (value && Object.hasOwn(MODES, value as string)) {
            persist({ ...draft, mode: value as Mode });
            setRemoved(null);
          }
        }}
        className="unit-modes"
        aria-label="比较方式"
        disabled={!ready}
      >
        {(Object.keys(MODES) as Mode[]).map((key) => (
          <label
            key={key}
            className={mode === key ? 'active' : ''}
            htmlFor={`mode-${key}`}
          >
            <RadioGroupItem id={`mode-${key}`} value={key} />
            {MODES[key].label}
          </label>
        ))}
      </RadioGroup>
      <section
        className={`unit-summary ${compared >= 2 ? 'has-comparison' : ''}`}
        aria-label="比价结果"
      >
        <output aria-live="polite">
          <span className="unit-summary-label">
            {compared >= 2
              ? `${compared} 个已填写商品 · 按每${MODES[mode].base}比较`
              : `统一比较每${MODES[mode].base}的价格`}
          </span>
          <strong>
            {compared < 2
              ? '填好两件商品，就能比较'
              : results.winners.length === compared
                ? '这些商品，单位价格相同'
                : `${winnerNames.join('、')}${results.winners.length > 1 ? '并列' : ''}最划算`}
          </strong>
          <span className="unit-summary-detail">
            {compared >= 2 && results.minimum !== null
              ? `最低 ¥${money(results.minimum)}/${MODES[mode].base}${results.saving !== null ? `，比${compared === 2 ? '另一件' : '下一档单价'}省 ${percentage(results.saving)}` : ''}${compared < rows.length ? `；另有 ${rows.length - compared} 件待填写` : ''}`
              : '不同包装先换算成同一单位，不用自己按计算器。'}
          </span>
        </output>
      </section>
      <div className="unit-products">
        {rows.map((row, index) => {
          const result = calculate(row, mode),
            cheapest =
              compared >= 2 &&
              results.winners.some((entry) => entry.product.id === row.id);
          const malformed =
            (!!row.price && !/^\d+(?:\.\d{1,2})?$/.test(row.price.trim())) ||
            (!!row.size && !(Number(row.size) > 0)) ||
            (!!row.packs && !/^[1-9]\d*$/.test(row.packs.trim()));
          return (
            <section
              className={`unit-product ${cheapest ? 'is-cheapest' : ''}`}
              key={row.id}
              aria-label={nameOf(row, index)}
            >
              <div className="unit-card-heading">
                <span className="unit-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <Input
                  className="unit-product-name"
                  aria-label={`商品${index + 1}名称（选填）`}
                  placeholder={`商品${String.fromCharCode(65 + index)}（可改名）`}
                  value={row.name}
                  maxLength={40}
                  disabled={!ready}
                  onChange={(e) => edit(row.id, 'name', e.target.value)}
                />
                {rows.length > 2 && (
                  <Button
                    variant="ghost"
                    className="unit-remove"
                    disabled={!ready}
                    aria-label={`移除${nameOf(row, index)}`}
                    onClick={() => {
                      setRemoved({ product: row, mode, index });
                      replaceRows(rows.filter((item) => item.id !== row.id));
                    }}
                  >
                    ×
                  </Button>
                )}
              </div>
              <label
                className="unit-field-label"
                htmlFor={`${mode}-${row.id}-price`}
              >
                实付总价 <span>元，含全部份数</span>
              </label>
              <div className="unit-price-input">
                <span aria-hidden="true">¥</span>
                <Input
                  id={`${mode}-${row.id}-price`}
                  inputMode="decimal"
                  maxLength={15}
                  placeholder={index === 0 ? '29.90' : '39.90'}
                  value={row.price}
                  disabled={!ready}
                  onChange={(e) => edit(row.id, 'price', e.target.value)}
                />
              </div>
              <div className="unit-specs">
                <div className="unit-spec">
                  <label htmlFor={`${mode}-${row.id}-size`}>
                    {mode === 'count' ? '每份数量' : '每份规格'}
                  </label>
                  <div className="unit-size-input">
                    <Input
                      id={`${mode}-${row.id}-size`}
                      inputMode="decimal"
                      maxLength={15}
                      placeholder={
                        mode === 'count' ? '10' : index === 0 ? '500' : '800'
                      }
                      value={row.size}
                      disabled={!ready}
                      onChange={(e) => edit(row.id, 'size', e.target.value)}
                    />
                    <NativeSelect
                      aria-label={`${nameOf(row, index)}的规格单位`}
                      value={row.unit}
                      disabled={!ready}
                      onChange={(e) =>
                        edit(row.id, 'unit', e.target.value as Unit)
                      }
                    >
                      {MODES[mode].units.map((unit) => (
                        <NativeSelectOption key={unit} value={unit}>
                          {UNITS[unit].label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
                </div>
                <span className="unit-times" aria-hidden="true">
                  ×
                </span>
                <div className="unit-pack">
                  <label htmlFor={`${mode}-${row.id}-packs`}>份数</label>
                  <Input
                    id={`${mode}-${row.id}-packs`}
                    inputMode="numeric"
                    maxLength={5}
                    value={row.packs}
                    disabled={!ready}
                    onChange={(e) => edit(row.id, 'packs', e.target.value)}
                  />
                </div>
              </div>
              <div className="unit-card-result">
                {result ? (
                  <>
                    <div>
                      <span>
                        共{' '}
                        {result.total.toLocaleString('zh-CN', {
                          maximumFractionDigits: 6,
                        })}{' '}
                        {MODES[mode].base}
                      </span>
                      <strong>
                        ¥{money(result.unitPrice)}
                        <small>/{MODES[mode].base}</small>
                      </strong>
                    </div>
                    {cheapest && (
                      <span className="unit-best">
                        {results.winners.length > 1 ? '并列最低' : '单价最低'}
                      </span>
                    )}
                  </>
                ) : (
                  <p
                    className={
                      malformed || (row.price && row.size && row.packs)
                        ? 'unit-invalid'
                        : ''
                    }
                  >
                    {malformed || (row.price && row.size && row.packs)
                      ? '请检查输入：价格最多2位小数，规格大于0，份数为正整数。'
                      : '填入价格和规格后显示单价'}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <div className="unit-actions">
        <Button
          variant="outline"
          className="unit-add"
          disabled={!ready || rows.length >= 6}
          onClick={() =>
            replaceRows([
              ...rows,
              emptyProduct(
                mode,
                Array.from(crypto.getRandomValues(new Uint32Array(2)), (word) =>
                  word.toString(16),
                ).join('-'),
              ),
            ])
          }
        >
          {rows.length >= 6 ? '最多比较 6 个商品' : '＋ 再加一个商品'}
        </Button>
        {removed && removed.mode === mode && rows.length < 6 && (
          <Button
            variant="ghost"
            disabled={!ready}
            className="unit-undo"
            onClick={() => {
              const next = [...rows];
              next.splice(
                Math.min(removed.index, next.length),
                0,
                removed.product,
              );
              replaceRows(next);
              setRemoved(null);
            }}
          >
            撤销移除
          </Button>
        )}
      </div>
      <p className="unit-storage">
        {!ready
          ? '正在读取暂存…'
          : storageMessage || '输入后自动暂存，下次打开继续比较'}
      </p>
      <p className="unit-note">
        比较同类、同品质商品更有意义。实付价请包含运费并扣除优惠；赠品可计入份数。重量中的
        1 斤按 500 克计算。各比较方式单独暂存，数据不跨设备同步。
      </p>
    </div>
  );
}

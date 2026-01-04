import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { formatCurrency, formatPercent } from '../lib/format';
import styles from './PieChart.module.css';

type Slice = {
  label: string;
  value: number;
  color: string;
};

type Tooltip = {
  label: string;
  value: number;
  x: number;
  y: number;
  percent: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function buildArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export default function PieChart({ data }: { data: Slice[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const visible = useMemo(
    () => data.filter((_, index) => !hidden.has(index) && data[index].value > 0),
    [data, hidden],
  );

  const total = useMemo(
    () => visible.reduce((sum, item) => sum + item.value, 0),
    [visible],
  );

  const slices = useMemo(() => {
    if (!total) return [] as Array<Slice & { path: string; percent: number }>;
    let cursor = -Math.PI / 2;
    return visible.map((item) => {
      const angle = (item.value / total) * Math.PI * 2;
      const startAngle = cursor;
      const endAngle = cursor + angle;
      cursor = endAngle;
      return {
        ...item,
        path: buildArc(90, 90, 70, startAngle, endAngle),
        percent: item.value / total,
      };
    });
  }, [visible, total]);

  const handleLegendClick = (index: number) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleTooltip = (
    event: MouseEvent<SVGPathElement>,
    slice: Slice & { percent: number },
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      label: slice.label,
      value: slice.value,
      percent: slice.percent,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <div className={styles.canvas}>
        {total === 0 ? (
          <div className={styles.empty}>Sem dados suficientes no período.</div>
        ) : (
          <svg viewBox="0 0 180 180" role="img" aria-label="Distribuição por categoria">
            {slices.map((slice) => (
              <path
                key={slice.label}
                d={slice.path}
                fill={slice.color}
                onMouseMove={(event) => handleTooltip(event, slice)}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </svg>
        )}
        {tooltip && (
          <div className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
            <strong>{tooltip.label}</strong>
            <span>{formatCurrency(tooltip.value)}</span>
            <span>{formatPercent(tooltip.percent * 100, false)}</span>
          </div>
        )}
      </div>
      <div className={styles.legend}>
        {data.map((item, index) => {
          const isHidden = hidden.has(index);
          return (
            <button
              type="button"
              key={item.label}
              className={`${styles.legendItem} ${isHidden ? styles.muted : ''}`}
              onClick={() => handleLegendClick(index)}
            >
              <span className={styles.swatch} style={{ background: item.color }} />
              <span>{item.label}</span>
              <span className={styles.legendValue}>{formatCurrency(item.value)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

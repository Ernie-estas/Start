import * as Slider from '@radix-ui/react-slider'

export function ParamSlider({ label, value, onChange, min, max, step = 1, format = v => v, unit = '', accent = '#3b82f6' }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-text-secondary">{label}</span>
        <span className="text-[11px] font-semibold mono" style={{ color: accent }}>{format(value)}{unit}</span>
      </div>
      <Slider.Root
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min} max={max} step={step}
        className="relative flex items-center w-full h-4 cursor-pointer"
      >
        <Slider.Track className="relative h-1 flex-1 bg-border-default rounded-full">
          <Slider.Range className="absolute h-full rounded-full" style={{ background: accent }} />
        </Slider.Track>
        <Slider.Thumb
          className="block w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 focus:outline-none focus:ring-2"
          style={{ borderColor: accent, '--tw-ring-color': accent + '40' }}
        />
      </Slider.Root>
    </div>
  )
}

export function MetricTile({ label, value, sub, color = '#e2e8f0' }) {
  return (
    <div className="metric-card">
      <p className="text-[9px] tracking-widest uppercase text-text-muted mb-1">{label}</p>
      <p className="text-base font-bold mono" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

export function ToolHeader({ title, description }) {
  return (
    <div className="mb-4 pb-3 border-b border-border-subtle">
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      <p className="text-xs text-text-muted mt-0.5">{description}</p>
    </div>
  )
}

export function MathNote({ children }) {
  return (
    <div className="mt-4 p-3 rounded-lg border border-border-subtle bg-bg-secondary/50">
      <p className="text-[10px] tracking-widest uppercase text-text-muted mb-1.5">Math note</p>
      <div className="text-[11px] text-text-secondary leading-relaxed mono">{children}</div>
    </div>
  )
}

export const TOOLTIP_STYLE = {
  background: '#0f1117',
  border: '1px solid #2a2f45',
  borderRadius: 8,
  fontSize: 11,
  padding: '6px 10px',
}

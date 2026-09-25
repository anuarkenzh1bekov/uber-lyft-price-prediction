import type { CSSProperties, ReactNode } from 'react'

interface Props {
  id: string
  label: string
  hint?: ReactNode
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  display: ReactNode
  valueText: string
  tone: string
  scale?: [string, string]
}

export function RangeField({ id, label, hint, min, max, step, value, onChange, display, valueText, tone, scale }: Props) {
  const fill = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 text-[13px]">
        <label htmlFor={id} className="text-dim">
          {label}
        </label>
        {hint && <span className="text-faint">{hint}</span>}
      </div>
      <output
        htmlFor={id}
        className="mt-1 block text-[clamp(2.4rem,3.6vw,3.25rem)] leading-none font-light tracking-[-0.05em] tabular-nums"
      >
        {display}
      </output>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range mt-4 w-full"
        style={{ '--fill': `${fill}%`, '--tone': tone } as CSSProperties}
      />
      {scale && (
        <div className="mt-1 flex justify-between font-mono text-[10px] text-faint" aria-hidden>
          <span>{scale[0]}</span>
          <span>{scale[1]}</span>
        </div>
      )}
    </div>
  )
}

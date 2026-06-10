import { useId } from 'react'

interface SliderProps {
    label: string
    value: number
    min: number
    max: number
    step?: number
    unit?: string
    formatValue?: (value: number) => string
    onChange: (value: number) => void
}

export function Slider({
    label,
    value,
    min,
    max,
    step = 1,
    unit,
    formatValue,
    onChange,
}: SliderProps) {
    const id = useId()
    const display = formatValue ? formatValue(value) : String(value)

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
                <label htmlFor={id} className="text-sm text-fg-b">
                    {label}
                </label>
                <span className="text-sm font-mono text-fg-a">
                    {display}{unit && <span className="text-fg-b ml-1">{unit}</span>}
                </span>
            </div>

            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full"
            />
        </div>
    )
}

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
    const percent = ((value - min) / (max - min)) * 100

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

            <div className="relative h-5 flex items-center">
                {/* Track background */}
                <div className="absolute inset-x-0 h-[6px] rounded-full bg-bg-d overflow-hidden">
                    {/* Filled portion */}
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: `${percent}%`,
                            backgroundColor: 'var(--color-accent)',
                        }}
                    />
                </div>

                {/* Native input */}
                <input
                    id={id}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="slider-input absolute inset-0 w-full appearance-none bg-transparent cursor-pointer"
                />
            </div>
        </div>
    )
}

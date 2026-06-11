import { Slider } from '@/components'

export interface DiscoveryConstraints {
    bandGapMin: number
    bandGapMax: number
    mobilityMin: number
    indiumFractionMax: number
}

interface ConstraintsProps {
    constraints: DiscoveryConstraints
    onChange: (patch: Partial<DiscoveryConstraints>) => void
}

export function Constraints({ constraints, onChange }: ConstraintsProps) {
    return (
        <div className="box flex flex-col gap-lg">
            <span className="text-xs text-fg-b uppercase tracking-wider">Target Constraints</span>

            <Slider
                label="Band gap min (eV)"
                value={constraints.bandGapMin}
                min={0.4}
                max={3.4}
                step={0.1}
                unit="eV"
                onChange={(v) => onChange({ bandGapMin: v })}
            />

            <Slider
                label="Band gap max (eV)"
                value={constraints.bandGapMax}
                min={0.4}
                max={3.4}
                step={0.1}
                unit="eV"
                onChange={(v) => onChange({ bandGapMax: v })}
            />

            <Slider
                label="Mobility min (cm²/Vs)"
                value={constraints.mobilityMin}
                min={0}
                max={1000}
                step={10}
                onChange={(v) => onChange({ mobilityMin: v })}
            />

            <Slider
                label="Indium fraction x"
                value={constraints.indiumFractionMax}
                min={0}
                max={1}
                step={0.05}
                formatValue={(v) => `0–${v.toFixed(2)}`}
                onChange={(v) => onChange({ indiumFractionMax: v })}
            />
        </div>
    )
}

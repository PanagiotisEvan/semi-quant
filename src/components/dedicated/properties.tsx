import { useState, useMemo } from 'react'
import { Slider } from '../reusable/form/slider'
import { MATERIALS } from '../../data/materials'
import { computeProperties, type MaterialId, type DopingType } from '../../data/formulas'

const MATERIAL_IDS: MaterialId[] = ['Si', 'Ge', 'GaN', 'Graphene']

const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹'

function toSuperscript(n: number): string {
    const sign = n < 0 ? '⁻' : ''
    return sign + String(Math.abs(n)).split('').map(c => SUPS[+c]).join('')
}

function fmtSci(x: number, digits = 2): string {
    if (!isFinite(x)) return '∞'
    if (x === 0) return '0'
    const exp = Math.floor(Math.log10(Math.abs(x)))
    const mantissa = x / 10 ** exp
    return `${mantissa.toFixed(digits)}×10${toSuperscript(exp)}`
}

function fmtFixed(x: number, digits: number): string {
    return x.toFixed(digits)
}

function fmtStrain(v: number): string {
    return `${v >= 0 ? '+' : ''}${v.toFixed(1)}`
}

function fmtDoping(v: number): string {
    return `10${toSuperscript(v)}`
}

interface ReadoutRow {
    label: string
    value: string
    unit: string
}

export function Properties() {
    const [materialId, setMaterialId] = useState<MaterialId>('Si')
    const [T, setT]                   = useState(300)
    const [logN, setLogN]             = useState(16)
    const [dopingType, setDopingType] = useState<DopingType>('n')
    const [strainPct, setStrainPct]   = useState(0)

    const mat    = MATERIALS[materialId]
    const N      = 10 ** logN
    const strain = strainPct / 100

    const props = useMemo(
        () => computeProperties(mat, T, N, dopingType, strain),
        [mat, T, N, dopingType, strain],
    )

    const isGraphene = mat.isGraphene

    const carrierUnit = isGraphene ? 'cm⁻²' : 'cm⁻³'
    const sigmaUnit   = isGraphene ? 'S/□'  : 'S/cm'
    const rhoUnit     = isGraphene ? 'Ω/□'  : 'Ω·cm'

    const rows: ReadoutRow[] = [
        { label: 'Band gap',  value: fmtFixed(props.Eg,    3), unit: 'eV'         },
        { label: 'n',         value: fmtSci(props.n),         unit: carrierUnit    },
        ...(!isGraphene ? [
            { label: 'p',  value: fmtSci(props.p),  unit: 'cm⁻³' },
            { label: 'nᵢ', value: fmtSci(props.ni), unit: 'cm⁻³' },
        ] : []),
        { label: 'μₙ',        value: fmtFixed(props.mu_n, 0), unit: 'cm²/V·s'    },
        ...(!isGraphene ? [
            { label: 'μₚ', value: fmtFixed(props.mu_p, 0), unit: 'cm²/V·s' },
        ] : []),
        { label: 'σ',         value: fmtSci(props.sigma),     unit: sigmaUnit     },
        { label: 'ρ',         value: fmtSci(props.rho),       unit: rhoUnit       },
        { label: 'a',         value: fmtFixed(props.a, 4),    unit: 'Å'           },
    ]

    return (
        <div className="flex flex-col gap-lg p-lg h-full">

            {/* Material selector */}
            <div className="flex flex-col gap-sm">
                <span className="text-xs text-fg-b uppercase tracking-wider">Material</span>
                <div className="grid grid-cols-2 gap-xs">
                    {MATERIAL_IDS.map(id => (
                        <button
                            key={id}
                            onClick={() => setMaterialId(id)}
                            className={`text-sm rounded-md py-sm transition-colors cursor-pointer ${
                                materialId === id
                                    ? 'bg-accent text-bg-a font-medium'
                                    : 'bg-bg-c text-fg-b hover:text-fg-a hover:bg-bg-d'
                            }`}
                        >
                            {id}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-bg-d" />

            {/* Controls */}
            <div className="flex flex-col gap-lg">
                <Slider
                    label="Temperature"
                    value={T}
                    min={100}
                    max={700}
                    step={10}
                    unit="K"
                    onChange={setT}
                />

                <div className="flex flex-col gap-sm">
                    <Slider
                        label="Doping"
                        value={logN}
                        min={14}
                        max={20}
                        step={1}
                        formatValue={fmtDoping}
                        unit={carrierUnit}
                        onChange={setLogN}
                    />
                    <div className="flex gap-xs">
                        {(['n', 'p'] as DopingType[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setDopingType(t)}
                                className={`flex-1 text-xs rounded-sm py-xs transition-colors cursor-pointer ${
                                    dopingType === t
                                        ? 'bg-accent text-bg-a font-medium'
                                        : 'bg-bg-c text-fg-b hover:text-fg-a hover:bg-bg-d'
                                }`}
                            >
                                {t === 'n' ? 'n-type' : 'p-type'}
                            </button>
                        ))}
                    </div>
                </div>

                <Slider
                    label="Strain"
                    value={strainPct}
                    min={-2}
                    max={2}
                    step={0.1}
                    formatValue={fmtStrain}
                    unit="%"
                    onChange={setStrainPct}
                />
            </div>

            <div className="h-px bg-bg-d" />

            {/* Readout */}
            <div className="flex flex-col gap-sm flex-1">
                <span className="text-xs text-fg-b uppercase tracking-wider">Computed</span>
                <div className="grid grid-cols-[auto_1fr] gap-x-lg gap-y-xs">
                    {rows.map(({ label, value, unit }) => (
                        <>
                            <span key={`${label}-l`} className="text-sm text-fg-b">{label}</span>
                            <span key={`${label}-v`} className="text-sm font-mono text-fg-a text-right">
                                {value}
                                <span className="text-fg-b text-xs ml-1">{unit}</span>
                            </span>
                        </>
                    ))}
                </div>
            </div>

        </div>
    )
}

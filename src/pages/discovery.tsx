import { useState, useMemo } from 'react'
import { Stat } from '@/components'
import { Constraints, CompositionHeatmap, type DiscoveryConstraints } from '@/components/dedicated/discovery'

const EG_INN = 0.7
const EG_GAN = 3.4
const BOWING = 1.4
const TOTAL_CANDIDATES = 400

function bandGap(x: number): number {
    return x * EG_INN + (1 - x) * EG_GAN - BOWING * x * (1 - x)
}

function mobility(x: number): number {
    return 1000 * Math.exp(-4.5 * x)
}

export function Discovery() {
    const [constraints, setConstraints] = useState<DiscoveryConstraints>({
        bandGapMin: 0.5,
        bandGapMax: 3.2,
        mobilityMin: 150,
        indiumFractionMax: 0.55,
    })

    const update = (patch: Partial<DiscoveryConstraints>) => {
        setConstraints(prev => ({ ...prev, ...patch }))
    }

    const results = useMemo(() => {
        const step = 1 / TOTAL_CANDIDATES
        let hits = 0

        for (let i = 0; i <= TOTAL_CANDIDATES; i++) {
            const x = i * step
            if (x > constraints.indiumFractionMax) continue
            const eg = bandGap(x)
            const mu = mobility(x)
            if (eg >= constraints.bandGapMin && eg <= constraints.bandGapMax && mu >= constraints.mobilityMin) {
                hits++
            }
        }

        const hitRate = TOTAL_CANDIDATES > 0 ? Math.round((hits / TOTAL_CANDIDATES) * 100) : 0
        return { hits, hitRate }
    }, [constraints])

    return (
        <div className="w-full h-full flex flex-col gap-sm p-lg overflow-y-auto [scrollbar-width:none]">

            <div className="flex flex-col gap-xs">
                <h6>Material Discovery</h6>
                <p className="text-sm text-fg-b">Quantum-simulated properties</p>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-sm">
                <Constraints constraints={constraints} onChange={update} />

                <div className="flex flex-col gap-sm">
                    <Stat title="Candidates screened" value={TOTAL_CANDIDATES} />
                    <Stat title="Meet all constraints" value={results.hits} />
                    <Stat title="Hit rate" value={results.hitRate} />
                </div>
            </div>

            <CompositionHeatmap constraints={constraints} />

        </div>
    )
}

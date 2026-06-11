import { useState, useCallback, useRef } from 'react'
import type { DiscoveryConstraints } from '@/components/dedicated/discovery'
import type { Candidate } from '@/components/dedicated/discovery'

const EG_INN = 0.7
const EG_GAN = 3.4
const BOWING = 1.4

// Resolution: how many points per unit of indium fraction
const DENSITY = 500

function bandGap(x: number): number {
    return x * EG_INN + (1 - x) * EG_GAN - BOWING * x * (1 - x)
}

function mobility(x: number): number {
    return 1000 * Math.exp(-4.5 * x)
}

export type SimulationStatus = 'idle' | 'running' | 'done'

export interface DiscoveryResults {
    hits: number
    hitRate: number
    topCandidates: Candidate[]
    processedCount: number
    totalCandidates: number
}

const EMPTY_RESULTS: DiscoveryResults = {
    hits: 0,
    hitRate: 0,
    topCandidates: [],
    processedCount: 0,
    totalCandidates: 0,
}

export function useDiscovery() {
    const [constraints, setConstraints] = useState<DiscoveryConstraints>({
        bandGapMin: 0.5,
        bandGapMax: 3.2,
        mobilityMin: 150,
        indiumFractionMax: 0.55,
    })

    const [status, setStatus] = useState<SimulationStatus>('idle')
    const [results, setResults] = useState<DiscoveryResults>(EMPTY_RESULTS)
    const [progress, setProgress] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const updateConstraints = useCallback((patch: Partial<DiscoveryConstraints>) => {
        setConstraints(prev => ({ ...prev, ...patch }))
        if (status === 'done') {
            setStatus('idle')
            setResults(EMPTY_RESULTS)
            setProgress(0)
        }
    }, [status])

    const runSimulation = useCallback(() => {
        if (status === 'running') return

        if (intervalRef.current) clearInterval(intervalRef.current)

        setStatus('running')
        setProgress(0)
        setResults(EMPTY_RESULTS)

        // Total candidates scales with the search range
        const totalCandidates = Math.max(10, Math.round(constraints.indiumFractionMax * DENSITY))
        const batchSize = Math.max(1, Math.round(totalCandidates / 40)) // ~40 batches → ~2s
        const totalBatches = Math.ceil(totalCandidates / batchSize)
        const tickMs = 50
        let batchIndex = 0

        let allCandidates: Candidate[] = []
        let totalHits = 0

        intervalRef.current = setInterval(() => {
            const startIdx = batchIndex * batchSize
            const endIdx = Math.min(startIdx + batchSize, totalCandidates)

            for (let i = startIdx; i < endIdx; i++) {
                const x = (i / totalCandidates) * constraints.indiumFractionMax

                const eg = bandGap(x)
                const mu = mobility(x)
                const meetsTarget =
                    eg >= constraints.bandGapMin &&
                    eg <= constraints.bandGapMax &&
                    mu >= constraints.mobilityMin

                if (meetsTarget) totalHits++
                allCandidates.push({ x, bandGap: eg, mobility: mu, meetsTarget })
            }

            batchIndex++
            const processed = Math.min(batchIndex * batchSize, totalCandidates)
            const pct = Math.round((processed / totalCandidates) * 100)

            const sorted = [...allCandidates].sort((a, b) => {
                if (a.meetsTarget !== b.meetsTarget) return a.meetsTarget ? -1 : 1
                return b.bandGap - a.bandGap
            })

            const hitRate = processed > 0 ? Math.round((totalHits / processed) * 100) : 0

            setProgress(pct)
            setResults({
                hits: totalHits,
                hitRate,
                topCandidates: sorted.slice(0, 10),
                processedCount: processed,
                totalCandidates,
            })

            if (batchIndex >= totalBatches) {
                if (intervalRef.current) clearInterval(intervalRef.current)
                intervalRef.current = null
                setStatus('done')
            }
        }, tickMs)
    }, [constraints, status])

    const reset = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setStatus('idle')
        setResults(EMPTY_RESULTS)
        setProgress(0)
    }, [])

    return {
        constraints,
        updateConstraints,
        status,
        progress,
        results,
        runSimulation,
        reset,
    }
}

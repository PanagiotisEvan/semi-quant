import { Button, Stat, ProgressBar } from '@/components'
import {
    Constraints,
    CompositionHeatmap,
    CandidatesTable,
} from '@/components/dedicated/discovery'
import { useDiscovery } from '@/hooks'

export function Discovery() {
    const {
        constraints,
        updateConstraints,
        status,
        progress,
        results,
        runSimulation,
    } = useDiscovery()

    const isIdle = status === 'idle'
    const isRunning = status === 'running'
    const isDone = status === 'done'
    const hasResults = isRunning || isDone

    const processedFraction = results.totalCandidates > 0
        ? results.processedCount / results.totalCandidates
        : 0

    return (
        <div className="w-full h-full flex flex-col gap-sm p-lg overflow-y-auto [scrollbar-width:none]">

            {/* Header */}
            <div className="flex flex-col gap-xs">
                <div className="flex flex-row items-center justify-between">
                    <h6>Material Discovery</h6>
                    <Button
                        label={isRunning ? 'Simulating...' : isDone ? 'Re-run Simulation' : 'Run Simulation'}
                        variant={isRunning ? 'b' : 'active'}
                        size="md"
                        onClick={runSimulation}
                    />
                </div>
            </div>

            {/* Constraints + Stats */}
            <div className="grid grid-cols-[1fr_auto] gap-sm">
                <Constraints constraints={constraints} onChange={updateConstraints} />

                <div className="flex flex-col gap-sm">
                    <Stat title="Candidates screened" value={results.processedCount} />
                    <Stat title="Meet all constraints" value={results.hits} />
                    <Stat title="Hit rate" value={results.hitRate} suffix="%" />
                </div>
            </div>

            {/* Progress bar while running */}
            {isRunning && (
                <ProgressBar progress={progress} label="Screening candidates..." />
            )}

            {/* Results — stream in during simulation */}
            {hasResults && (
                <>
                    <CompositionHeatmap
                        constraints={constraints}
                        processedFraction={processedFraction}
                    />
                    <CandidatesTable candidates={results.topCandidates} />
                </>
            )}

            {/* Idle state */}
            {isIdle && (
                <div className="box flex-1 flex items-center justify-center">
                    <p className="text-sm text-fg-b">
                        Configure constraints and run simulation to discover candidates
                    </p>
                </div>
            )}

        </div>
    )
}

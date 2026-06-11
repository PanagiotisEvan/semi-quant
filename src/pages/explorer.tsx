import { Properties, LatticeViewer } from '@/components'
import { useSimulation } from '@/hooks'

export function Explorer() {
    const { state, derived, actions } = useSimulation()

    return (
        <div className="w-full h-full grid grid-cols-[320px_1fr] overflow-hidden">

            <aside className="overflow-y-auto [scrollbar-width:none] m-md bg-bg-b rounded-lg">
                <Properties
                    materialId={state.materialId}
                    temperature={state.temperature}
                    logDoping={state.logDoping}
                    dopingType={state.dopingType}
                    strainPct={state.strainPct}
                    supercellN={state.supercellN}
                    mat={derived.mat}
                    properties={derived.properties}
                    onMaterialChange={actions.setMaterialId}
                    onTemperatureChange={actions.setTemperature}
                    onLogDopingChange={actions.setLogDoping}
                    onDopingTypeChange={actions.setDopingType}
                    onStrainPctChange={actions.setStrainPct}
                    onSupercellNChange={actions.setSupercellN}
                />
            </aside>

            <main className="overflow-hidden">
                <LatticeViewer
                    materialId={state.materialId}
                    mat={derived.mat}
                    temperature={state.temperature}
                    dopingConcentration={derived.dopingConcentration}
                    dopingType={state.dopingType}
                    strain={derived.strain}
                    supercellN={state.supercellN}
                />
            </main>

        </div>
    )
}

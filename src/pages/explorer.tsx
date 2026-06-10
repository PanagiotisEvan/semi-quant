import { useState } from 'react'
import { Properties } from '../components/dedicated/properties'
import { LatticeViewer } from '../components/dedicated/lattice-view'
import { MATERIALS } from '../data/materials'
import type { MaterialId, DopingType } from '../data/formulas'

export function Explorer() {
    const [materialId, setMaterialId] = useState<MaterialId>('Si')
    const [temperature, setTemperature] = useState(300)
    const [logDoping, setLogDoping] = useState(16)
    const [dopingType, setDopingType] = useState<DopingType>('n')
    const [strainPct, setStrainPct] = useState(0)

    const mat = MATERIALS[materialId]
    const dopingConcentration = 10 ** logDoping
    const strain = strainPct / 100

    return (
        <div className="w-full h-screen grid grid-cols-[320px_1fr] grid-rows-[auto_1fr] gap-0 overflow-hidden">

            {/* Header */}
            <header className="col-span-2 flex items-center justify-between p-md border-b border-bg-d">
                <p className="p1">QSilicon</p>
                <span className="text-sm text-fg-b">Material Explorer</span>
            </header>

            {/* Left — Properties panel */}
            <aside className="row-start-2 border-r border-bg-d overflow-y-auto">
                <Properties
                    materialId={materialId}
                    temperature={temperature}
                    logDoping={logDoping}
                    dopingType={dopingType}
                    strainPct={strainPct}
                    onMaterialChange={setMaterialId}
                    onTemperatureChange={setTemperature}
                    onLogDopingChange={setLogDoping}
                    onDopingTypeChange={setDopingType}
                    onStrainPctChange={setStrainPct}
                />
            </aside>

            {/* Center — Viewfinder */}
            <main className="row-start-2 overflow-hidden">
                <LatticeViewer
                    materialId={materialId}
                    mat={mat}
                    temperature={temperature}
                    dopingConcentration={dopingConcentration}
                    dopingType={dopingType}
                    strain={strain}
                />
            </main>

        </div>
    )
}

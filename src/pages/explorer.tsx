import { useState } from 'react'
import { Navbar } from '../components/layout/navbar'
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
    const [supercellN, setSupercellN] = useState(2)

    const mat = MATERIALS[materialId]
    const dopingConcentration = 10 ** logDoping
    const strain = strainPct / 100

    return (
        <div className="w-full h-screen grid grid-cols-[320px_1fr] grid-rows-[auto_1fr] gap-0 overflow-hidden">

            <div className="col-span-2">
                <Navbar subtitle="Material Explorer" />
            </div>

            {/* Left — Properties panel */}
            <aside className="row-start-2 border-r border-bg-d overflow-y-auto">
                <Properties
                    materialId={materialId}
                    temperature={temperature}
                    logDoping={logDoping}
                    dopingType={dopingType}
                    strainPct={strainPct}
                    supercellN={supercellN}
                    onMaterialChange={setMaterialId}
                    onTemperatureChange={setTemperature}
                    onLogDopingChange={setLogDoping}
                    onDopingTypeChange={setDopingType}
                    onStrainPctChange={setStrainPct}
                    onSupercellNChange={setSupercellN}
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
                    supercellN={supercellN}
                />
            </main>

        </div>
    )
}

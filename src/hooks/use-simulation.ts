import { useState, useMemo } from 'react'
import { MATERIALS } from '@/data/materials'
import { computeProperties, type MaterialId, type DopingType, type SemiconductorProperties } from '@/data/formulas'

export interface SimulationState {
    materialId: MaterialId
    temperature: number
    logDoping: number
    dopingType: DopingType
    strainPct: number
    supercellN: number
}

export interface SimulationDerived {
    mat: typeof MATERIALS[MaterialId]
    dopingConcentration: number
    strain: number
    properties: SemiconductorProperties
}

export interface SimulationActions {
    setMaterialId: (id: MaterialId) => void
    setTemperature: (t: number) => void
    setLogDoping: (n: number) => void
    setDopingType: (d: DopingType) => void
    setStrainPct: (s: number) => void
    setSupercellN: (n: number) => void
}

export function useSimulation() {
    const [materialId, setMaterialId] = useState<MaterialId>('Si')
    const [temperature, setTemperature] = useState(300)
    const [logDoping, setLogDoping] = useState(16)
    const [dopingType, setDopingType] = useState<DopingType>('n')
    const [strainPct, setStrainPct] = useState(0)
    const [supercellN, setSupercellN] = useState(2)

    const mat = MATERIALS[materialId]
    const dopingConcentration = 10 ** logDoping
    const strain = strainPct / 100

    const properties = useMemo(
        () => computeProperties(mat, temperature, dopingConcentration, strain),
        [mat, temperature, dopingConcentration, strain],
    )

    const state: SimulationState = {
        materialId, temperature, logDoping, dopingType, strainPct, supercellN,
    }

    const derived: SimulationDerived = {
        mat, dopingConcentration, strain, properties,
    }

    const actions: SimulationActions = {
        setMaterialId, setTemperature, setLogDoping, setDopingType, setStrainPct, setSupercellN,
    }

    return { state, derived, actions }
}

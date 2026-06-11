import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as $3Dmol from '3dmol'
import type { MaterialId, MaterialParams, DopingType } from '@/data/formulas.ts'
import { dopantVisualCount, dopantAtomSymbol } from '@/data/formulas.ts'
import { Legend, Tooltip, CellInfo } from '@/components'
import { useLegendItems, useAutoSpin, useAtomHover, getElementName, useUnitCellWireframe } from '@/hooks'

// ─── Config ────────────────────────────────────────────────────────────────────

const CIF_PATHS: Record<MaterialId, string> = {
    Si: '/cif/silicon.cif',
    Ge: '/cif/germanium.cif',
    GaN: '/cif/gallium_nitride.cif',
    Graphene: '/cif/graphene.cif',
}

interface CellParams { a: number; b: number; c: number; gamma: number }

const CELL_PARAMS: Record<MaterialId, CellParams> = {
    Si:       { a: 5.431, b: 5.431, c: 5.431, gamma: 90 },
    Ge:       { a: 5.658, b: 5.658, c: 5.658, gamma: 90 },
    GaN:      { a: 3.189, b: 3.189, c: 5.185, gamma: 120 },
    Graphene: { a: 2.461, b: 2.461, c: 6.708, gamma: 120 },
}

const ELEM_COLORS: Record<string, string> = {
    Si: '#90d549', Ge: '#668fad', Ga: '#e07850', N: '#4488ff', C: '#cccccc',
    P: '#ff9900', B: '#3399ff', As: '#ff6644', Mg: '#aa44cc',
}

const ELEM_RADII: Record<string, number> = {
    Si: 0.45, Ge: 0.47, Ga: 0.42, N: 0.35, C: 0.38,
    P: 0.48, B: 0.36, As: 0.50, Mg: 0.44,
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FracAtom { elem: string; fx: number; fy: number; fz: number }
interface ParsedMaterial { fracAtoms: FracAtom[]; gammaRad: number }

// ─── Styling helper ────────────────────────────────────────────────────────────

function applyStyles(viewer: $3Dmol.GLViewer) {
    for (const elem of Object.keys(ELEM_COLORS)) {
        viewer.setStyle({ elem }, {
            sphere: { radius: ELEM_RADII[elem] ?? 0.40, color: ELEM_COLORS[elem] },
            stick: { radius: 0.08, color: '#2c2c2c' },
        })
    }
}

// ─── Heat overlay helper ───────────────────────────────────────────────────────

function useHeatOverlay(temperature: number) {
    return useMemo(() => {
        const t = Math.max(0, Math.min(1, (temperature - 100) / 600))

        if (t < 0.25) {
            const intensity = (0.25 - t) / 0.25
            return {
                background: `radial-gradient(ellipse at center, rgba(60,120,220,${intensity * 0.12}) 0%, transparent 70%)`,
            }
        } else if (t > 0.5) {
            const intensity = (t - 0.5) / 0.5
            return {
                background: `radial-gradient(ellipse at center, rgba(255,${Math.round(120 - intensity * 60)},${Math.round(40 - intensity * 30)},${intensity * 0.18}) 0%, transparent 70%)`,
            }
        }
        return { background: 'none' }
    }, [temperature])
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface LatticeViewerProps {
    materialId: MaterialId
    mat: MaterialParams
    temperature: number
    dopingConcentration: number
    dopingType: DopingType
    strain: number
    supercellN: number
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function LatticeViewer({
    materialId,
    mat,
    temperature,
    dopingConcentration,
    dopingType,
    strain,
    supercellN,
}: LatticeViewerProps) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<$3Dmol.GLViewer | null>(null)
    const parsedRef = useRef<Record<string, ParsedMaterial>>({})
    const [cifCache, setCifCache] = useState<Record<string, string>>({})
    const lastStrainRef = useRef<number | null>(null)
    const lastMaterialRef = useRef<MaterialId | null>(null)

    const legendItems = useLegendItems(materialId, dopingType, dopingConcentration)
    const { tooltip, attachHoverable } = useAtomHover(viewerRef.current, wrapperRef.current)
    const renderWireframe = useUnitCellWireframe(viewerRef.current, materialId, strain, mat.nu, supercellN)
    const heatStyle = useHeatOverlay(temperature)

    useAutoSpin(viewerRef.current, materialId)

    const latticeConstant = mat.a0 * (1 + strain)

    useEffect(() => {
        if (!canvasRef.current || viewerRef.current) return
        const viewer = $3Dmol.createViewer(canvasRef.current, { backgroundColor: '#000000' })
        viewerRef.current = viewer
        return () => { viewer.clear(); viewerRef.current = null }
    }, [])

    useEffect(() => {
        const path = CIF_PATHS[materialId]
        if (cifCache[path]) return

        fetch(path)
            .then(res => res.text())
            .then(text => {
                setCifCache(prev => ({ ...prev, [path]: text }))

                if (!parsedRef.current[materialId]) {
                    const viewer = viewerRef.current
                    if (!viewer) return

                    const cell = CELL_PARAMS[materialId]
                    const gammaRad = cell.gamma * Math.PI / 180
                    const sinG = Math.sin(gammaRad)
                    const cosG = Math.cos(gammaRad)

                    const tempModel = viewer.addModel(text, 'cif')
                    const baseAtoms = tempModel.selectedAtoms({})

                    const baseFrac: FracAtom[] = baseAtoms.map(a => {
                        const x = a.x ?? 0, y = a.y ?? 0, z = a.z ?? 0
                        const fy = y / (cell.b * sinG)
                        const fx = (x - cell.b * cosG * fy) / cell.a
                        const fz = z / cell.c
                        return { elem: a.elem ?? '', fx, fy, fz }
                    })

                    viewer.removeAllModels()
                    parsedRef.current[materialId] = { fracAtoms: baseFrac, gammaRad }
                }
            })
    }, [materialId])

    // Build XYZ with dopant elements baked in
    const buildXYZ = useCallback((
        matId: MaterialId,
        strainVal: number,
        nu: number,
        n: number,
        dopConc: number,
        dopType: DopingType,
    ): string | null => {
        const parsed = parsedRef.current[matId]
        if (!parsed) return null

        const cell = CELL_PARAMS[matId]
        const { fracAtoms: baseFrac, gammaRad } = parsed

        const isGraphene = matId === 'Graphene'
        const nx = n, ny = n, nz = isGraphene ? 1 : n

        const sa = cell.a * (1 + strainVal)
        const sb = cell.b * (1 - nu * strainVal)
        const sc = cell.c * (1 - nu * strainVal)

        const cosG = Math.cos(gammaRad)
        const sinG = Math.sin(gammaRad)

        const vax = sa, vbx = sb * cosG, vby = sb * sinG, vcz = sc

        const totalAtoms = baseFrac.length * nx * ny * nz
        const positions = new Float64Array(totalAtoms * 3)
        const elems: string[] = []
        let idx = 0, cx = 0, cy = 0, cz = 0

        // Determine the primary element that gets doped
        const primaryElem = matId === 'GaN' ? 'Ga'
            : matId === 'Graphene' ? 'C'
            : matId === 'Ge' ? 'Ge' : 'Si'

        const dopantCount = dopantVisualCount(dopConc)
        const dopantSym = dopantAtomSymbol(matId, dopType)

        // Track which primary-element atoms to dope
        const primaryIndices: number[] = []

        for (let ix = 0; ix < nx; ix++) {
            for (let iy = 0; iy < ny; iy++) {
                for (let iz = 0; iz < nz; iz++) {
                    for (const base of baseFrac) {
                        const fx = base.fx + ix, fy = base.fy + iy, fz = base.fz + iz
                        const x = fx * vax + fy * vbx
                        const y = fy * vby
                        const z = fz * vcz
                        positions[idx * 3] = x
                        positions[idx * 3 + 1] = y
                        positions[idx * 3 + 2] = z
                        cx += x; cy += y; cz += z

                        if (base.elem === primaryElem) {
                            primaryIndices.push(idx)
                        }
                        elems.push(base.elem)
                        idx++
                    }
                }
            }
        }
        cx /= totalAtoms; cy /= totalAtoms; cz /= totalAtoms

        // Replace dopant positions in the element array
        if (dopantCount > 0 && primaryIndices.length > 0) {
            const step = Math.max(1, Math.floor(primaryIndices.length / dopantCount))
            for (let i = 0; i < dopantCount && i * step < primaryIndices.length; i++) {
                const atomIdx = primaryIndices[i * step]
                elems[atomIdx] = dopantSym
            }
        }

        const lines = [`${totalAtoms}`, 'supercell']
        for (let i = 0; i < totalAtoms; i++) {
            lines.push(`${elems[i]} ${(positions[i * 3] - cx).toFixed(4)} ${(positions[i * 3 + 1] - cy).toFixed(4)} ${(positions[i * 3 + 2] - cz).toFixed(4)}`)
        }
        return lines.join('\n')
    }, [])

    const rebuildScene = useCallback((zoom: boolean) => {
        const viewer = viewerRef.current
        if (!viewer || !parsedRef.current[materialId]) return

        viewer.removeAllModels()
        viewer.removeAllShapes()

        const xyz = buildXYZ(materialId, strain, mat.nu, supercellN, dopingConcentration, dopingType)
        if (!xyz) return

        viewer.addModel(xyz, 'xyz')
        applyStyles(viewer)
        attachHoverable()
        renderWireframe()

        if (zoom) viewer.zoomTo()
        viewer.render()

        lastMaterialRef.current = materialId
        lastStrainRef.current = strain
    }, [materialId, strain, mat.nu, supercellN, dopingConcentration, dopingType, buildXYZ, attachHoverable, renderWireframe])

    // Full rebuild on material change
    useEffect(() => {
        if (!viewerRef.current || !parsedRef.current[materialId]) return
        rebuildScene(true)
    }, [materialId, cifCache])

    // Geometry update on strain / supercell change
    useEffect(() => {
        if (!viewerRef.current || !parsedRef.current[materialId]) return
        if (lastMaterialRef.current !== materialId) return
        rebuildScene(false)
    }, [strain, supercellN])

    // Doping changes need a full rebuild now (element symbols change in XYZ)
    useEffect(() => {
        if (!viewerRef.current || !parsedRef.current[materialId]) return
        if (lastMaterialRef.current !== materialId) return
        rebuildScene(false)
    }, [dopingConcentration, dopingType])

    // Temperature only needs wireframe redraw + heat overlay (handled by React)
    useEffect(() => {
        const viewer = viewerRef.current
        if (!viewer || !viewer.getModel()) return

        viewer.removeAllShapes()
        renderWireframe()
        viewer.render()
    }, [temperature])

    return (
        <div ref={wrapperRef} className="relative w-full h-full">
            <div ref={canvasRef} className="absolute inset-0" />

            <div
                className="absolute inset-0 pointer-events-none transition-all duration-300"
                style={heatStyle}
            />

            <CellInfo
                materialId={materialId}
                supercellN={supercellN}
                latticeConstant={latticeConstant}
            />
            <Legend items={legendItems} />

            {tooltip && (
                <Tooltip x={tooltip.screenX} y={tooltip.screenY}>
                    <span className="font-mono font-medium">{tooltip.elem}</span>
                    <span className="text-fg-b ml-sm">{getElementName(tooltip.elem)}</span>
                    <div className="text-[10px] text-fg-b font-mono mt-px">
                        ({tooltip.x.toFixed(2)}, {tooltip.y.toFixed(2)}, {tooltip.z.toFixed(2)}) Å
                    </div>
                </Tooltip>
            )}
        </div>
    )
}

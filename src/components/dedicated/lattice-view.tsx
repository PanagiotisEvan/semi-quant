import { useEffect, useRef, useState, useCallback } from 'react'
import * as $3Dmol from '3dmol'
import type { MaterialId, MaterialParams, DopingType } from '../../data/formulas'
import {
    dopantVisualCount,
    dopantAtomSymbol,
} from '../../data/formulas'

// ─── CIF file paths ────────────────────────────────────────────────────────────

const CIF_PATHS: Record<MaterialId, string> = {
    Si: '/cif/silicon.cif',
    Ge: '/cif/germanium.cif',
    GaN: '/cif/gallium_nitride.cif',
    Graphene: '/cif/graphene.cif',
}

// ─── Supercell repetitions ─────────────────────────────────────────────────────

const SUPERCELL: Record<MaterialId, [number, number, number]> = {
    Si: [2, 2, 2],
    Ge: [2, 2, 2],
    GaN: [3, 3, 2],
    Graphene: [4, 4, 1],
}

// ─── Cell parameters per material ──────────────────────────────────────────────

interface CellParams {
    a: number
    b: number
    c: number
    gamma: number
}

const CELL_PARAMS: Record<MaterialId, CellParams> = {
    Si:       { a: 5.431, b: 5.431, c: 5.431, gamma: 90 },
    Ge:       { a: 5.658, b: 5.658, c: 5.658, gamma: 90 },
    GaN:      { a: 3.189, b: 3.189, c: 5.185, gamma: 120 },
    Graphene: { a: 2.461, b: 2.461, c: 6.708, gamma: 120 },
}

// ─── Element colors & radii ────────────────────────────────────────────────────

const ELEM_COLORS: Record<string, string> = {
    Si: '#90d549', Ge: '#668fad', Ga: '#e07850', N: '#4488ff', C: '#cccccc',
    P: '#ff9900', B: '#3399ff', As: '#ff6644', Mg: '#aa44cc',
}

const ELEM_RADII: Record<string, number> = {
    Si: 0.45, Ge: 0.47, Ga: 0.42, N: 0.35, C: 0.38,
    P: 0.48, B: 0.36, As: 0.50, Mg: 0.44,
}

// ─── Pre-computed fractional atom data per material ────────────────────────────

interface FracAtom {
    elem: string
    fx: number
    fy: number
    fz: number
}

interface ParsedMaterial {
    fracAtoms: FracAtom[]  // all supercell atoms in fractional coords
    gammaRad: number
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface LatticeViewerProps {
    materialId: MaterialId
    mat: MaterialParams
    temperature: number
    dopingConcentration: number
    dopingType: DopingType
    strain: number
}

export function LatticeViewer({
    materialId,
    mat,
    temperature,
    dopingConcentration,
    dopingType,
    strain,
}: LatticeViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<$3Dmol.GLViewer | null>(null)
    const parsedRef = useRef<Record<string, ParsedMaterial>>({})
    const [cifCache, setCifCache] = useState<Record<string, string>>({})
    const lastStrainRef = useRef<number | null>(null)
    const lastMaterialRef = useRef<MaterialId | null>(null)

    // Create the viewer once
    useEffect(() => {
        if (!containerRef.current || viewerRef.current) return

        const viewer = $3Dmol.createViewer(containerRef.current, {
            backgroundColor: '#000000',
        })
        viewerRef.current = viewer

        return () => {
            viewer.clear()
            viewerRef.current = null
        }
    }, [])

    // Fetch & parse CIF file when material changes
    useEffect(() => {
        const path = CIF_PATHS[materialId]
        if (cifCache[path]) return

        fetch(path)
            .then(res => res.text())
            .then(text => {
                setCifCache(prev => ({ ...prev, [path]: text }))

                // Pre-parse: extract base atoms and build supercell fractional coords
                if (!parsedRef.current[materialId]) {
                    const viewer = viewerRef.current
                    if (!viewer) return

                    const cell = CELL_PARAMS[materialId]
                    const gammaRad = cell.gamma * Math.PI / 180
                    const sinG = Math.sin(gammaRad)
                    const cosG = Math.cos(gammaRad)

                    // Temporarily load CIF to read atom positions
                    const tempModel = viewer.addModel(text, 'cif')
                    const baseAtoms = tempModel.selectedAtoms({})

                    // Convert to fractional
                    const baseFrac: FracAtom[] = baseAtoms.map(a => {
                        const x = a.x ?? 0
                        const y = a.y ?? 0
                        const z = a.z ?? 0
                        const fy = y / (cell.b * sinG)
                        const fx = (x - cell.b * cosG * fy) / cell.a
                        const fz = z / cell.c
                        return { elem: a.elem ?? '', fx, fy, fz }
                    })

                    viewer.removeAllModels()

                    // Build supercell fractional positions
                    const [nx, ny, nz] = SUPERCELL[materialId]
                    const fracAtoms: FracAtom[] = []

                    for (let ix = 0; ix < nx; ix++) {
                        for (let iy = 0; iy < ny; iy++) {
                            for (let iz = 0; iz < nz; iz++) {
                                for (const base of baseFrac) {
                                    fracAtoms.push({
                                        elem: base.elem,
                                        fx: base.fx + ix,
                                        fy: base.fy + iy,
                                        fz: base.fz + iz,
                                    })
                                }
                            }
                        }
                    }

                    parsedRef.current[materialId] = { fracAtoms, gammaRad }
                }
            })
    }, [materialId])

    // Build XYZ from fractional coords + strain (pure math, no 3Dmol)
    const buildXYZ = useCallback((matId: MaterialId, strainVal: number, nu: number): string | null => {
        const parsed = parsedRef.current[matId]
        if (!parsed) return null

        const cell = CELL_PARAMS[matId]
        const { fracAtoms, gammaRad } = parsed

        const sa = cell.a * (1 + strainVal)
        const sb = cell.b * (1 - nu * strainVal)
        const sc = cell.c * (1 - nu * strainVal)

        const cosG = Math.cos(gammaRad)
        const sinG = Math.sin(gammaRad)

        // Strained lattice vectors
        const vax = sa, vay = 0
        const vbx = sb * cosG, vby = sb * sinG
        const vcz = sc

        // Compute centered positions
        let cx = 0, cy = 0, cz = 0
        const n = fracAtoms.length

        const positions = new Float64Array(n * 3)
        for (let i = 0; i < n; i++) {
            const a = fracAtoms[i]
            const x = a.fx * vax + a.fy * vbx
            const y = a.fx * vay + a.fy * vby
            const z = a.fz * vcz
            positions[i * 3] = x
            positions[i * 3 + 1] = y
            positions[i * 3 + 2] = z
            cx += x; cy += y; cz += z
        }
        cx /= n; cy /= n; cz /= n

        // Build XYZ string
        const lines = [`${n}`, 'supercell']
        for (let i = 0; i < n; i++) {
            const a = fracAtoms[i]
            lines.push(`${a.elem} ${(positions[i * 3] - cx).toFixed(4)} ${(positions[i * 3 + 1] - cy).toFixed(4)} ${(positions[i * 3 + 2] - cz).toFixed(4)}`)
        }
        return lines.join('\n')
    }, [])

    // Full rebuild when material changes
    useEffect(() => {
        const viewer = viewerRef.current
        if (!viewer || !parsedRef.current[materialId]) return

        viewer.removeAllModels()
        viewer.removeAllShapes()
        viewer.removeAllLabels()

        const xyz = buildXYZ(materialId, strain, mat.nu)
        if (!xyz) return

        viewer.addModel(xyz, 'xyz')
        applyStyles(viewer, materialId, dopingConcentration, dopingType)
        viewer.zoomTo()
        viewer.render()

        lastMaterialRef.current = materialId
        lastStrainRef.current = strain
    }, [materialId, cifCache])

    // Geometry update when strain changes (rebuild model, keep camera)
    useEffect(() => {
        const viewer = viewerRef.current
        if (!viewer || !parsedRef.current[materialId]) return
        if (lastMaterialRef.current !== materialId) return // material effect handles this
        if (lastStrainRef.current === strain) return

        viewer.removeAllModels()

        const xyz = buildXYZ(materialId, strain, mat.nu)
        if (!xyz) return

        viewer.addModel(xyz, 'xyz')
        applyStyles(viewer, materialId, dopingConcentration, dopingType)
        viewer.render() // no zoomTo — keep current camera

        lastStrainRef.current = strain
    }, [strain])

    // Style-only update when doping changes (no geometry rebuild)
    useEffect(() => {
        const viewer = viewerRef.current
        if (!viewer) return
        if (!viewer.getModel()) return

        applyStyles(viewer, materialId, dopingConcentration, dopingType)
        viewer.render()
    }, [dopingConcentration, dopingType, temperature])

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ position: 'relative' }}
        />
    )
}

// ─── Styling helper ────────────────────────────────────────────────────────────

function applyStyles(
    viewer: $3Dmol.GLViewer,
    materialId: MaterialId,
    dopingConcentration: number,
    dopingType: DopingType,
) {
    const primaryElem = materialId === 'GaN' ? 'Ga'
        : materialId === 'Graphene' ? 'C'
        : materialId === 'Ge' ? 'Ge' : 'Si'

    const dopantCount = dopantVisualCount(dopingConcentration)
    const dopantSym = dopantAtomSymbol(materialId, dopingType)
    const dopantColor = ELEM_COLORS[dopantSym] ?? '#ff9900'
    const dopantRadius = ELEM_RADII[dopantSym] ?? 0.40

    // Base styles
    for (const elem of Object.keys(ELEM_COLORS)) {
        viewer.setStyle({ elem }, {
            sphere: { radius: ELEM_RADII[elem] ?? 0.40, color: ELEM_COLORS[elem] },
            stick: { radius: 0.08, color: '#2c2c2c' },
        })
    }

    // Dopant overrides
    if (dopantCount > 0) {
        const primaryAtoms = viewer.selectedAtoms({ elem: primaryElem })
        const step = Math.max(1, Math.floor(primaryAtoms.length / dopantCount))

        for (let i = 0; i < dopantCount && i * step < primaryAtoms.length; i++) {
            const atom = primaryAtoms[i * step]
            if (atom?.serial !== undefined) {
                viewer.setStyle(
                    { serial: atom.serial },
                    {
                        sphere: { radius: dopantRadius, color: dopantColor },
                        stick: { radius: 0.08, color: '#2c2c2c' },
                    },
                )
            }
        }
    }
}

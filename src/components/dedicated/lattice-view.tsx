import { useEffect, useRef, useState } from 'react'
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

// ─── Cell parameters per material (matching the CIF files) ─────────────────────

interface CellParams {
    a: number
    b: number
    c: number
    gamma: number // degrees
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
    const [cifCache, setCifCache] = useState<Record<string, string>>({})

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

    // Fetch CIF file when material changes
    useEffect(() => {
        const path = CIF_PATHS[materialId]
        if (cifCache[path]) return

        fetch(path)
            .then(res => res.text())
            .then(text => {
                setCifCache(prev => ({ ...prev, [path]: text }))
            })
    }, [materialId])

    // Rebuild scene when material or parameters change
    useEffect(() => {
        const viewer = viewerRef.current
        const cifText = cifCache[CIF_PATHS[materialId]]
        if (!viewer || !cifText) return

        viewer.removeAllModels()
        viewer.removeAllShapes()
        viewer.removeAllLabels()

        const cell = CELL_PARAMS[materialId]
        const [nx, ny, nz] = SUPERCELL[materialId]
        const nu = mat.nu

        // Apply strain: uniaxial along x, Poisson contraction on y/z
        const strainedA = cell.a * (1 + strain)
        const strainedB = cell.b * (1 - nu * strain)
        const strainedC = cell.c * (1 - nu * strain)

        const gammaRad = cell.gamma * Math.PI / 180

        // Strained lattice vectors
        const va = { x: strainedA, y: 0, z: 0 }
        const vb = { x: strainedB * Math.cos(gammaRad), y: strainedB * Math.sin(gammaRad), z: 0 }
        const vc = { x: 0, y: 0, z: strainedC }

        // Load one copy of the CIF to get base atom positions
        const baseModel = viewer.addModel(cifText, 'cif')
        const baseAtoms = baseModel.selectedAtoms({})

        // Record the unstrained positions from the CIF
        interface BaseAtom { elem: string; x: number; y: number; z: number }
        const basePositions: BaseAtom[] = baseAtoms.map(a => ({
            elem: a.elem ?? '',
            x: a.x ?? 0,
            y: a.y ?? 0,
            z: a.z ?? 0,
        }))

        // Convert cartesian → fractional (inverse of lattice matrix)
        // For orthorhombic (gamma=90): trivial division
        // For hexagonal (gamma=120): need proper inverse
        function cartToFrac(x: number, y: number, z: number) {
            const sinG = Math.sin(gammaRad)
            const cosG = Math.cos(gammaRad)
            // Inverse of the lattice matrix [va0, vb0, vc0]
            const fy = y / (cell.b * sinG)
            const fx = (x - cell.b * cosG * fy) / cell.a
            const fz = z / cell.c
            return { fx, fy, fz }
        }

        // Now clear the base model — we'll rebuild everything with strained positions
        viewer.removeAllModels()

        // Build all supercell atoms with strained positions
        interface PlacedAtom { elem: string; x: number; y: number; z: number }
        const allAtoms: PlacedAtom[] = []

        for (let ix = 0; ix < nx; ix++) {
            for (let iy = 0; iy < ny; iy++) {
                for (let iz = 0; iz < nz; iz++) {
                    for (const base of basePositions) {
                        // Get fractional coords of this atom in the original cell
                        const frac = cartToFrac(base.x, base.y, base.z)

                        // Apply fractional offset for supercell position
                        const fx = frac.fx + ix
                        const fy = frac.fy + iy
                        const fz = frac.fz + iz

                        // Convert back to cartesian using STRAINED lattice vectors
                        const x = fx * va.x + fy * vb.x + fz * vc.x
                        const y = fx * va.y + fy * vb.y + fz * vc.y
                        const z = fx * va.z + fy * vb.z + fz * vc.z

                        allAtoms.push({ elem: base.elem, x, y, z })
                    }
                }
            }
        }

        // Center the structure
        let cx = 0, cy = 0, cz = 0
        for (const a of allAtoms) { cx += a.x; cy += a.y; cz += a.z }
        cx /= allAtoms.length; cy /= allAtoms.length; cz /= allAtoms.length

        // Build an XYZ string from the placed atoms (3Dmol parses XYZ easily)
        let xyz = `${allAtoms.length}\nstrained supercell\n`
        for (const a of allAtoms) {
            xyz += `${a.elem} ${(a.x - cx).toFixed(6)} ${(a.y - cy).toFixed(6)} ${(a.z - cz).toFixed(6)}\n`
        }

        viewer.addModel(xyz, 'xyz')

        // ─── Doping ────────────────────────────────────────────────────────
        const primaryElem = materialId === 'GaN' ? 'Ga'
            : materialId === 'Graphene' ? 'C'
            : materialId === 'Ge' ? 'Ge' : 'Si'

        const dopantCount = dopantVisualCount(dopingConcentration)
        const dopantSym = dopantAtomSymbol(materialId, dopingType)
        const dopantColor = ELEM_COLORS[dopantSym] ?? '#ff9900'
        const dopantRadius = ELEM_RADII[dopantSym] ?? 0.40

        // ─── Styling ──────────────────────────────────────────────────────
        for (const elem of Object.keys(ELEM_COLORS)) {
            const color = ELEM_COLORS[elem]
            const radius = ELEM_RADII[elem] ?? 0.40
            viewer.setStyle({ elem }, {
                sphere: { radius, color },
                stick: { radius: 0.08, color: '#2c2c2c' },
            })
        }

        // Override dopant atoms
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

        viewer.zoomTo()
        viewer.render()

    }, [materialId, mat, cifCache, temperature, dopingConcentration, dopingType, strain])

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ position: 'relative' }}
        />
    )
}

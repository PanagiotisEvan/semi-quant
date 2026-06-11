import { useCallback } from 'react'
import type { GLViewer } from '3dmol'
import type { MaterialId } from '@/data/formulas'

interface CellParams { a: number; b: number; c: number; gamma: number }

const CELL_PARAMS: Record<MaterialId, CellParams> = {
    Si:       { a: 5.431, b: 5.431, c: 5.431, gamma: 90 },
    Ge:       { a: 5.658, b: 5.658, c: 5.658, gamma: 90 },
    GaN:      { a: 3.189, b: 3.189, c: 5.185, gamma: 120 },
    Graphene: { a: 2.461, b: 2.461, c: 6.708, gamma: 120 },
}

export function useUnitCellWireframe(
    viewer: GLViewer | null,
    materialId: MaterialId,
    strain: number,
    nu: number,
    supercellN: number,
) {
    return useCallback(() => {
        if (!viewer) return

        const cell = CELL_PARAMS[materialId]
        const isGraphene = materialId === 'Graphene'
        const n = supercellN

        const a = cell.a * (1 + strain)
        const b = cell.b * (1 - nu * strain)
        const c = cell.c * (1 - nu * strain)

        const gammaRad = cell.gamma * Math.PI / 180
        const cosG = Math.cos(gammaRad)
        const sinG = Math.sin(gammaRad)

        const va = { x: a, y: 0, z: 0 }
        const vb = { x: b * cosG, y: b * sinG, z: 0 }
        const vc = { x: 0, y: 0, z: c }

        const nx = n, ny = n, nz = isGraphene ? 1 : n
        const midX = Math.floor(nx / 2)
        const midY = Math.floor(ny / 2)
        const midZ = isGraphene ? 0 : Math.floor(nz / 2)

        let cx = 0, cy = 0, cz = 0
        for (let ix = 0; ix < nx; ix++) {
            for (let iy = 0; iy < ny; iy++) {
                for (let iz = 0; iz < nz; iz++) {
                    const x = (ix + 0.5) * va.x + (iy + 0.5) * vb.x
                    const y = (iy + 0.5) * vb.y
                    const z = (iz + 0.5) * vc.z
                    cx += x; cy += y; cz += z
                }
            }
        }
        const nCells = nx * ny * nz
        cx /= nCells; cy /= nCells; cz /= nCells

        const ox = midX * va.x + midY * vb.x - cx
        const oy = midY * vb.y - cy
        const oz = midZ * vc.z - cz

        const corners = [
            { x: ox,                  y: oy,          z: oz },
            { x: ox + va.x,           y: oy,          z: oz },
            { x: ox + vb.x,           y: oy + vb.y,   z: oz },
            { x: ox + va.x + vb.x,    y: oy + vb.y,   z: oz },
            { x: ox,                  y: oy,          z: oz + vc.z },
            { x: ox + va.x,           y: oy,          z: oz + vc.z },
            { x: ox + vb.x,           y: oy + vb.y,   z: oz + vc.z },
            { x: ox + va.x + vb.x,    y: oy + vb.y,   z: oz + vc.z },
        ]

        const edges: [number, number][] = [
            [0, 1], [0, 2], [1, 3], [2, 3],
            [4, 5], [4, 6], [5, 7], [6, 7],
            [0, 4], [1, 5], [2, 6], [3, 7],
        ]

        const lineColor = '#90d549'
        const lineRadius = 0.03

        for (const [i, j] of edges) {
            viewer.addCylinder({
                start: corners[i],
                end: corners[j],
                radius: lineRadius,
                color: lineColor,
                fromCap: true,
                toCap: true,
            })
        }

        for (const corner of corners) {
            viewer.addSphere({
                center: corner,
                radius: lineRadius * 1.5,
                color: lineColor,
            })
        }
    }, [viewer, materialId, strain, nu, supercellN])
}

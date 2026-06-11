import { useCallback } from 'react'
import type { GLViewer } from '3dmol'
import type { MaterialId, DopingType } from '../data/formulas'
import { dopantVisualCount, dopantAtomSymbol } from '../data/formulas'

const ELEM_COLORS: Record<string, string> = {
    Si: '#90d549', Ge: '#668fad', Ga: '#e07850', N: '#4488ff', C: '#cccccc',
    P: '#ff9900', B: '#3399ff', As: '#ff6644', Mg: '#aa44cc',
}

/**
 * Returns a `renderClouds` function that adds translucent electron cloud
 * spheres around dopant atoms. Call after every scene rebuild.
 * The caller is responsible for calling `viewer.removeAllShapes()` first.
 */
export function useElectronClouds(
    viewer: GLViewer | null,
    materialId: MaterialId,
    dopingConcentration: number,
    dopingType: DopingType,
    temperature: number,
) {
    return useCallback(() => {
        if (!viewer) return

        const dopantCount = dopantVisualCount(dopingConcentration)
        if (dopantCount === 0) return

        const primaryElem = materialId === 'GaN' ? 'Ga'
            : materialId === 'Graphene' ? 'C'
            : materialId === 'Ge' ? 'Ge' : 'Si'

        const dopantSym = dopantAtomSymbol(materialId, dopingType)
        const cloudColor = ELEM_COLORS[dopantSym] ?? '#ff9900'

        // Cloud radius: base 1.4Å, grows with temperature
        const baseRadius = 1.4
        const tempScale = 1 + (temperature - 100) / 800
        const cloudRadius = baseRadius * tempScale

        const primaryAtoms = viewer.selectedAtoms({ elem: primaryElem })
        const step = Math.max(1, Math.floor(primaryAtoms.length / dopantCount))

        for (let i = 0; i < dopantCount && i * step < primaryAtoms.length; i++) {
            const atom = primaryAtoms[i * step]
            if (atom) {
                viewer.addSphere({
                    center: { x: atom.x ?? 0, y: atom.y ?? 0, z: atom.z ?? 0 },
                    radius: cloudRadius,
                    color: cloudColor,
                    opacity: 0.25,
                    wireframe: false,
                })
            }
        }
    }, [viewer, materialId, dopingConcentration, dopingType, temperature])
}

import { useMemo } from 'react'
import { dopantVisualCount, dopantAtomSymbol, type MaterialId, type DopingType } from '@/data/formulas'

const ELEM_COLORS: Record<string, string> = {
    Si: '#90d549', Ge: '#668fad', Ga: '#e07850', N: '#4488ff', C: '#cccccc',
    P: '#ff9900', B: '#3399ff', As: '#ff6644', Mg: '#aa44cc',
}

const ELEM_NAMES: Record<string, string> = {
    Si: 'Silicon', Ge: 'Germanium', Ga: 'Gallium', N: 'Nitrogen',
    C: 'Carbon', P: 'Phosphorus', B: 'Boron', As: 'Arsenic', Mg: 'Magnesium',
}

const HOST_ATOMS: Record<MaterialId, string[]> = {
    Si: ['Si'],
    Ge: ['Ge'],
    GaN: ['Ga', 'N'],
    Graphene: ['C'],
}

export function useLegendItems(
    materialId: MaterialId,
    dopingType: DopingType,
    dopingConcentration: number,
) {
    return useMemo(() => {
        const hosts = HOST_ATOMS[materialId]
        const dopant = dopantAtomSymbol(materialId, dopingType)
        const hasDopant = dopantVisualCount(dopingConcentration) > 0

        const items = hosts.map(elem => ({
            symbol: elem,
            name: ELEM_NAMES[elem] ?? elem,
            color: ELEM_COLORS[elem] ?? '#888',
            note: '— host',
        }))

        items.push({
            symbol: dopant,
            name: ELEM_NAMES[dopant] ?? dopant,
            color: ELEM_COLORS[dopant] ?? '#ff9900',
            note: `— ${dopingType}-type dopant${!hasDopant ? ' (below threshold)' : ''}`,
            dimmed: !hasDopant,
        })

        return items
    }, [materialId, dopingType, dopingConcentration])
}

import type { MaterialId } from '@/data/formulas'

const STRUCTURE_NAMES: Record<MaterialId, string> = {
    Si: 'Diamond Cubic',
    Ge: 'Diamond Cubic',
    GaN: 'Wurtzite',
    Graphene: 'Hexagonal 2D',
}

const ATOMS_PER_CELL: Record<MaterialId, number> = {
    Si: 8,
    Ge: 8,
    GaN: 4,
    Graphene: 2,
}

const SPACE_GROUPS: Record<MaterialId, string> = {
    Si: 'Fd3̄m',
    Ge: 'Fd3̄m',
    GaN: 'P6₃mc',
    Graphene: 'P6₃mc',
}

interface CellInfoProps {
    materialId: MaterialId
    supercellN: number
    latticeConstant: number
}

export function CellInfo({ materialId, supercellN, latticeConstant }: CellInfoProps) {
    const isGraphene = materialId === 'Graphene'
    const nx = supercellN
    const ny = supercellN
    const nz = isGraphene ? 1 : supercellN

    const totalAtoms = ATOMS_PER_CELL[materialId] * nx * ny * nz
    const supercellLabel = isGraphene ? `${nx}×${ny}` : `${nx}×${ny}×${nz}`

    return (
        <div className="box-float absolute top-lg right-lg z-10 flex flex-col gap-px">
            <div className="flex items-center gap-sm">
                <span className="text-xs text-fg-a font-medium">{STRUCTURE_NAMES[materialId]}</span>
                <span className="text-[10px] text-fg-b font-mono">{SPACE_GROUPS[materialId]}</span>
            </div>
            <div className="text-[11px] text-fg-b font-mono">
                {totalAtoms} atoms · {supercellLabel} supercell
            </div>
            <div className="text-[11px] text-fg-b font-mono">
                a = {latticeConstant.toFixed(3)} Å
            </div>
        </div>
    )
}

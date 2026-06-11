import { Tag } from '@/components/reusable/form/tag'

export interface Candidate {
    x: number
    bandGap: number
    mobility: number
    meetsTarget: boolean
}

interface CandidatesTableProps {
    candidates: Candidate[]
}

export function CandidatesTable({ candidates }: CandidatesTableProps) {
    return (
        <div className="box flex flex-col gap-md">
            <span className="text-xs text-fg-b uppercase tracking-wider">Top Candidates</span>

            <table className="w-full">
                <thead>
                    <tr className="text-left text-xs text-fg-b uppercase tracking-wider">
                        <th className="pb-sm font-medium">Composition</th>
                        <th className="pb-sm font-medium text-right">Band Gap</th>
                        <th className="pb-sm font-medium text-right">Mobility</th>
                        <th className="pb-sm font-medium text-right">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {candidates.map((c) => (
                        <tr key={c.x} className="border-t border-bg-d">
                            <td className="py-sm text-sm text-fg-a font-mono">
                                In<sub>{c.x.toFixed(2)}</sub>Ga<sub>{(1 - c.x).toFixed(2)}</sub>N
                            </td>
                            <td className="py-sm text-sm text-fg-a font-mono text-right">
                                {c.bandGap.toFixed(2)} eV
                            </td>
                            <td className="py-sm text-sm text-fg-a font-mono text-right">
                                {Math.round(c.mobility)} cm²/Vs
                            </td>
                            <td className="py-sm text-right">
                                <Tag
                                    label={c.meetsTarget ? 'target' : 'miss'}
                                    variant={c.meetsTarget ? 'success' : 'error'}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

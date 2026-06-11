interface LegendItem {
    symbol: string
    name: string
    color: string
    note?: string
    dimmed?: boolean
}

interface LegendProps {
    items: LegendItem[]
}

export function Legend({ items }: LegendProps) {
    return (
        <div className="box-float absolute bottom-lg left-lg z-10 flex flex-col gap-xs">
            {items.map((item) => (
                <div
                    key={item.symbol}
                    className={`flex items-center gap-sm ${item.dimmed ? 'opacity-40' : ''}`}
                >
                    <span
                        className="w-[10px] h-[10px] rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-fg-a font-mono">{item.symbol}</span>
                    <span className="text-xs text-fg-b">
                        {item.name}{item.note && ` ${item.note}`}
                    </span>
                </div>
            ))}
        </div>
    )
}

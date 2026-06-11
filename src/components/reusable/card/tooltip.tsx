interface TooltipProps {
    x: number
    y: number
    children: React.ReactNode
}

export function Tooltip({ x, y, children }: TooltipProps) {
    return (
        <div
            className="absolute pointer-events-none px-sm py-xs rounded-md border border-bg-d text-xs text-fg-a z-10"
            style={{
                left: x + 12,
                top: y - 8,
                backgroundColor: 'rgba(0,0,0,0.85)',
            }}
        >
            {children}
        </div>
    )
}

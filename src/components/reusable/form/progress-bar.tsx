interface ProgressBarProps {
    progress: number
    label?: string
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
    return (
        <div className="flex flex-col gap-xs">
            {label && (
                <div className="flex items-baseline justify-between">
                    <span className="text-xs text-fg-b">{label}</span>
                    <span className="text-xs font-mono text-fg-a">{progress}%</span>
                </div>
            )}
            <div className="w-full h-[4px] rounded-full bg-bg-d overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-150 ease-out"
                    style={{
                        width: `${progress}%`,
                        backgroundColor: 'var(--color-accent)',
                    }}
                />
            </div>
        </div>
    )
}

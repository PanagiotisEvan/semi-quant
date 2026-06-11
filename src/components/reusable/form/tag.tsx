interface TagProps {
    label: string
    variant?: 'success' | 'error'
}

export function Tag({ label, variant = 'success' }: TagProps) {
    const styles = {
        success: 'bg-accent/15 text-accent',
        error: 'bg-error/15 text-error',
    }

    const icon = variant === 'success' ? '✓' : '✗'

    return (
        <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-full text-xs font-medium ${styles[variant]}`}>
            {icon} {label}
        </span>
    )
}

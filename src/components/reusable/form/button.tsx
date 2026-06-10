interface ButtonProps {
    label?: React.ReactNode
    className?: string
    variant?: 'a' | 'b' | 'active' | 'alpha'
    size?: 'fit' | 'sm' | 'md' | 'lg'
    onClick?: () => void
}

export function Button({
    label = 'Button',
    variant = 'a',
    size = 'md',
    className,
    onClick,
}: ButtonProps) {
    const variants = {
        a: 'bg-bg-c text-fg-b hover:text-fg-a hover:bg-bg-d',
        b: 'bg-bg-d text-fg-b hover:text-fg-a hover:bg-bg-e',
        active: 'bg-accent text-bg-a font-medium',
        alpha: 'bg-transparent text-fg-b hover:text-fg-a',
    }

    const sizes = {
        fit: 'w-fit h-fit px-md py-sm',
        sm: 'px-sm py-xs',
        md: 'px-md py-sm',
        lg: 'px-lg py-md',
    }

    return (
        <button
            onClick={onClick}
            className={`cursor-pointer rounded-md text-sm transition-colors ${variants[variant]} ${sizes[size]} ${className ?? ''}`}
        >
            {label}
        </button>
    )
}

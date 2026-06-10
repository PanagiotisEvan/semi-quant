interface ButtonProps {
    label?: React.ReactNode
    className?: string
    variant?: 'a' | 'b' | 'alpha'
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
    // Button types
    const variants = {
        a: 'bg-c px-md py-sm',
        b: 'bg-d px-md py-sm',
        alpha: 'bg-none p-none',
    }

    // Button sizes
    const sizes = {
        fit: 'w-fit h-fit p4',

        sm: 'w-[7.5rem] h-[2rem] p4',
        md: 'w-[8.75rem] h-[2.5rem] p3',
        lg: 'w-[11rem] h-[3.5rem] p2',
    }

    return (
        <button
            onClick={onClick}
            className={`cursor-pointer rounded-full ${className} ${variants[variant]} ${sizes[size]}`}
        >
            {label}
        </button>
    )
}

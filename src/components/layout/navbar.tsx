interface NavbarProps {
    title?: string
    subtitle?: string
}

export function Navbar({ title = 'QSilicon™', subtitle }: NavbarProps) {
    return (
        <header className="flex items-center justify-between p-md border-b border-bg-d">
            <p className="p1">{title}</p>
            {subtitle && <span className="text-sm text-fg-b">{subtitle}</span>}
        </header>
    )
}

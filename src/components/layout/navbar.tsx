import { Button } from '@/components'

export type Page = 'explorer' | 'discovery'

interface NavbarProps {
    title?: string
    activePage: Page
    onNavigate: (page: Page) => void
}

export function Navbar({ title = 'QSilicon™', activePage, onNavigate }: NavbarProps) {
    return (
        <header className="flex items-center justify-between p-md border-b border-bg-d">
            <p className="p1">{title}</p>
            <div className="flex flex-row gap-sm items-center">
                <Button
                    label="Explorer"
                    variant={activePage === 'explorer' ? 'active' : 'a'}
                    size="sm"
                    onClick={() => onNavigate('explorer')}
                />
                <Button
                    label="Discovery"
                    variant={activePage === 'discovery' ? 'active' : 'a'}
                    size="sm"
                    onClick={() => onNavigate('discovery')}
                />
            </div>
        </header>
    )
}

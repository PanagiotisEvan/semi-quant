import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

import { Navbar, type Page } from '@/components/layout/navbar'
import { Explorer } from '@/pages/explorer'
import { Discovery } from '@/pages/discovery'

function App() {
    const [page, setPage] = useState<Page>('explorer')

    return (
        <div className="w-full h-screen grid grid-rows-[auto_1fr] overflow-hidden">
            <Navbar activePage={page} onNavigate={setPage} />
            {page === 'explorer' && <Explorer />}
            {page === 'discovery' && <Discovery />}
        </div>
    )
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)

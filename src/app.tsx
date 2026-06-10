import { useState } from 'react'
import { Properties } from './components/dedicated/properties'
import { Help } from './components/dedicated/help'

export function App() {
    const [showHelp, setShowHelp] = useState(false)

    return (
        <div className="w-full h-screen grid grid-cols-[320px_1fr_360px] grid-rows-[auto_1fr] gap-0 overflow-hidden">

            {/* Header */}
            <header className="col-span-3 flex items-center justify-between p-md border-b border-bg-d">
                <h1>QSilicon</h1>
                <div className="flex items-center gap-md">
                    <span className="text-sm text-fg-b">Material Explorer</span>
                    <button
                        onClick={() => setShowHelp(true)}
                        className="text-xs text-fg-b border border-bg-d rounded-md px-sm py-xs hover:text-fg-a hover:border-bg-e transition-colors cursor-pointer"
                    >
                        Help
                    </button>
                </div>
            </header>

            {/* Left — Properties panel */}
            <aside className="row-start-2 border-r border-bg-d overflow-y-auto">
                <Properties />
            </aside>

            {/* Center — Viewfinder */}
            <main className="row-start-2 overflow-hidden">
                <p className="text-fg-b text-sm">Viewfinder</p>
            </main>

            {/* Right — Output */}
            <aside className="row-start-2 border-l border-bg-d overflow-y-auto">
                <p className="text-fg-b text-sm">Output</p>
            </aside>

            {showHelp && <Help onClose={() => setShowHelp(false)} />}

        </div>
    )
}

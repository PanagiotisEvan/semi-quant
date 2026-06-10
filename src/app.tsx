export function App() {
    return (
        <div className="w-full h-screen grid grid-cols-[320px_1fr_360px] grid-rows-[auto_1fr] gap-0 overflow-hidden">

            {/* Header */}
            <header className="col-span-3 flex items-center justify-between p-md border-b border-bg-d">
                <h1>QSilicon</h1>
                <span className="text-sm text-fg-b">Material Explorer</span>
            </header>

            {/* Left — Properties panel */}
            <aside className="row-start-2 border-r border-bg-d overflow-y-auto">
                <p className="text-fg-b text-sm">Properties</p>
            </aside>

            {/* Center — Viewfinder */}
            <main className="row-start-2 overflow-hidden">
                <p className="text-fg-b text-sm">Viewfinder</p>
            </main>

            {/* Right — Output */}
            <aside className="row-start-2 border-l border-bg-d overflow-y-auto">
                <p className="text-fg-b text-sm">Output</p>
            </aside>

        </div>
    )
}

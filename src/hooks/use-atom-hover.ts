import { useEffect, useState, useRef, useCallback } from 'react'
import type { GLViewer } from '3dmol'

export interface AtomTooltip {
    elem: string
    x: number
    y: number
    z: number
    screenX: number
    screenY: number
}

const ELEM_NAMES: Record<string, string> = {
    Si: 'Silicon', Ge: 'Germanium', Ga: 'Gallium', N: 'Nitrogen',
    C: 'Carbon', P: 'Phosphorus', B: 'Boron', As: 'Arsenic', Mg: 'Magnesium',
}

export function getElementName(sym: string): string {
    return ELEM_NAMES[sym] ?? sym
}

/**
 * Uses 3Dmol's built-in setHoverable for reliable atom detection.
 * Returns tooltip data, null when not hovering, and a reattach function
 * that must be called after any model rebuild.
 */
export function useAtomHover(viewer: GLViewer | null, container: HTMLDivElement | null) {
    const [tooltip, setTooltip] = useState<AtomTooltip | null>(null)
    const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

    // Track mouse position relative to container
    useEffect(() => {
        if (!container) return

        const handleMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect()
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            }
        }

        const handleLeave = () => setTooltip(null)

        container.addEventListener('mousemove', handleMove)
        container.addEventListener('mouseleave', handleLeave)

        return () => {
            container.removeEventListener('mousemove', handleMove)
            container.removeEventListener('mouseleave', handleLeave)
        }
    }, [container])

    // Attach hoverable to current model — call after every rebuild
    const attachHoverable = useCallback(() => {
        if (!viewer) return

        viewer.setHoverable(
            {},
            true,
            (atom: any) => {
                if (!atom) return
                setTooltip({
                    elem: atom.elem ?? '',
                    x: atom.x ?? 0,
                    y: atom.y ?? 0,
                    z: atom.z ?? 0,
                    screenX: mouseRef.current.x,
                    screenY: mouseRef.current.y,
                })
            },
            () => {
                setTooltip(null)
            },
        )
    }, [viewer])

    // Update screen position while tooltip is active
    useEffect(() => {
        if (!tooltip || !container) return

        const handleMove = () => {
            setTooltip(prev => prev ? {
                ...prev,
                screenX: mouseRef.current.x,
                screenY: mouseRef.current.y,
            } : null)
        }

        container.addEventListener('mousemove', handleMove)
        return () => container.removeEventListener('mousemove', handleMove)
    }, [tooltip, container])

    return { tooltip, attachHoverable }
}

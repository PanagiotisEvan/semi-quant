import { useEffect, useRef } from 'react'
import type { GLViewer } from '3dmol'

/**
 * Auto-rotates the viewer on load, stops on first user interaction.
 * Restarts when `trigger` changes (e.g. material switch).
 */
export function useAutoSpin(viewer: GLViewer | null, trigger: unknown) {
    const stoppedRef = useRef(false)
    const listenerRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        if (!viewer) return

        stoppedRef.current = false
        viewer.spin('y', 1)

        const stop = () => {
            if (!stoppedRef.current) {
                stoppedRef.current = true
                viewer.spin(false)
            }
        }

        // Stop spinning on any user interaction with the canvas
        const canvas = viewer.getCanvas()
        if (canvas) {
            canvas.addEventListener('pointerdown', stop, { once: true })
            canvas.addEventListener('wheel', stop, { once: true })
            listenerRef.current = stop
        }

        // Also stop after a timeout
        const timer = setTimeout(stop, 4000)

        return () => {
            clearTimeout(timer)
            if (canvas && listenerRef.current) {
                canvas.removeEventListener('pointerdown', listenerRef.current)
                canvas.removeEventListener('wheel', listenerRef.current)
            }
            viewer.spin(false)
        }
    }, [viewer, trigger])
}

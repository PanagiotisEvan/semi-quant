import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { DiscoveryConstraints } from './constraints'

const EG_INN = 0.7
const EG_GAN = 3.4
const BOWING = 1.4

function bandGap(x: number): number {
    return x * EG_INN + (1 - x) * EG_GAN - BOWING * x * (1 - x)
}

interface HeatmapProps {
    constraints: DiscoveryConstraints
    /** 0–1, how far through the composition space we've scanned */
    processedFraction?: number
}

export function CompositionHeatmap({ constraints, processedFraction = 1 }: HeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<echarts.ECharts | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const chart = echarts.init(containerRef.current, undefined, { renderer: 'canvas' })
        chartRef.current = chart

        const handleResize = () => chart.resize()
        const observer = new ResizeObserver(handleResize)
        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
            chart.dispose()
            chartRef.current = null
        }
    }, [])

    useEffect(() => {
        const chart = chartRef.current
        if (!chart) return

        const { bandGapMin, bandGapMax, indiumFractionMax } = constraints

        const xSteps = 100
        const ySteps = 60
        const yMin = 0.4, yMax = 3.4

        // Only render up to the processed fraction of the x-axis
        const maxXi = Math.round(processedFraction * (xSteps - 1))

        const heatmapData: [number, number, number][] = []

        for (let xi = 0; xi < xSteps; xi++) {
            const x = xi / (xSteps - 1)
            const eg = bandGap(x)

            for (let yi = 0; yi < ySteps; yi++) {
                const y = yMin + (yi / (ySteps - 1)) * (yMax - yMin)

                // Beyond processed range — show nothing
                if (xi > maxXi) {
                    heatmapData.push([xi, yi, 0])
                    continue
                }

                const dist = Math.abs(y - eg)
                const spread = 0.15 + 0.3 * x

                if (dist < spread) {
                    const inTarget = x <= indiumFractionMax && y >= bandGapMin && y <= bandGapMax
                    heatmapData.push([xi, yi, inTarget ? 1 : 0.3])
                } else {
                    heatmapData.push([xi, yi, 0])
                }
            }
        }

        // Band gap curve — only up to processed fraction
        const curveData: [number, number][] = []
        for (let i = 0; i <= 50; i++) {
            const x = i / 50
            if (x > processedFraction) break
            curveData.push([x, bandGap(x)])
        }

        const xLabels = Array.from({ length: xSteps }, (_, i) => (i / (xSteps - 1)).toFixed(2))
        const yLabels = Array.from({ length: ySteps }, (_, i) => (yMin + (i / (ySteps - 1)) * (yMax - yMin)).toFixed(2))

        chart.setOption({
            backgroundColor: 'transparent',
            title: {
                text: 'BAND GAP · COMPOSITION HEATMAP',
                left: 16,
                top: 12,
                textStyle: {
                    color: '#bdbdbd',
                    fontSize: 11,
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif',
                },
            },
            grid: { left: 60, right: 20, top: 50, bottom: 80 },
            xAxis: {
                type: 'category',
                data: xLabels,
                axisLabel: {
                    color: '#bdbdbd', fontSize: 10, fontFamily: 'Inter, sans-serif',
                    interval: xSteps / 4 - 1,
                    formatter: (val: string) => {
                        const v = parseFloat(val)
                        if (v === 0) return 'x=0 (GaN)'
                        if (v === 1) return 'x=1 (InN)'
                        return `x=${v.toFixed(2)}`
                    },
                },
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#3c3c3c' } },
                splitLine: { show: false },
            },
            yAxis: {
                type: 'category',
                data: yLabels,
                axisLabel: {
                    color: '#bdbdbd', fontSize: 10, fontFamily: 'Inter, sans-serif',
                    interval: ySteps / 5 - 1,
                    formatter: (val: string) => `${parseFloat(val).toFixed(1)} eV`,
                },
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#3c3c3c' } },
                splitLine: { show: false },
            },
            visualMap: {
                show: false, min: 0, max: 1,
                inRange: { color: ['rgba(0,0,0,0)', 'rgba(100,100,100,0.4)', '#90d549'] },
            },
            series: [
                {
                    type: 'heatmap', data: heatmapData,
                    progressive: 0, animation: false,
                    emphasis: { disabled: true },
                    itemStyle: { borderWidth: 0 },
                },
                {
                    type: 'line',
                    data: curveData.map(([x, y]) => [
                        Math.round(x * (xSteps - 1)),
                        Math.round(((y - yMin) / (yMax - yMin)) * (ySteps - 1)),
                    ]),
                    smooth: true, symbol: 'none',
                    lineStyle: { color: '#bdbdbd', width: 2 },
                    z: 10,
                },
                {
                    type: 'line', data: [], z: 20,
                    markArea: {
                        silent: true,
                        itemStyle: {
                            color: 'transparent',
                            borderColor: '#90d549',
                            borderWidth: 2,
                            borderType: 'dashed',
                        },
                        data: [[
                            {
                                xAxis: xLabels[0],
                                yAxis: yLabels[Math.round(((bandGapMin - yMin) / (yMax - yMin)) * (ySteps - 1))],
                            },
                            {
                                xAxis: xLabels[Math.round(indiumFractionMax * (xSteps - 1))],
                                yAxis: yLabels[Math.round(((bandGapMax - yMin) / (yMax - yMin)) * (ySteps - 1))],
                            },
                        ]],
                    },
                },
                // Scan line — vertical line showing where we are
                ...(processedFraction < 1 ? [{
                    type: 'line' as const,
                    data: [[maxXi, 0], [maxXi, ySteps - 1]],
                    symbol: 'none',
                    lineStyle: {
                        color: '#90d549',
                        width: 1,
                        type: 'dashed' as const,
                        opacity: 0.6,
                    },
                    z: 15,
                }] : []),
            ],
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(0,0,0,0.85)',
                borderColor: '#2c2c2c',
                textStyle: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter, sans-serif' },
                formatter: (params: any) => {
                    if (params.seriesType === 'heatmap') {
                        const x = parseFloat(xLabels[params.data[0]])
                        const eg = bandGap(x)
                        return `In<sub>${x.toFixed(2)}</sub>Ga<sub>${(1 - x).toFixed(2)}</sub>N<br/>Band gap: ${eg.toFixed(3)} eV`
                    }
                    return ''
                },
            },
        }, true)
    }, [constraints, processedFraction])

    return (
        <div className="box">
            <div ref={containerRef} className="w-full h-100" />
        </div>
    )
}

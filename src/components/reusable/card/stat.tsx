import NumberFlow from '@number-flow/react'

interface StatProps {
    title: string
    value: number
    suffix?: string
}

export function Stat({ title = "Title Here", value = 100, suffix }: StatProps) {
    return (
        <div className="box w-75 h-fit flex flex-col justify-center">
            <p className="text-sm text-fg-b">{title}</p>
            <NumberFlow
                value={value}
                suffix={suffix}
                className="text-accent h4"
                transformTiming={{ duration: 400, easing: 'ease-out' }}
                spinTiming={{ duration: 500, easing: 'ease-out' }}
            />
        </div>
    )
}

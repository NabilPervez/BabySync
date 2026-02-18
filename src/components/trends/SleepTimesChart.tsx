"use client"

import { useMemo } from "react"
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"

interface SleepTimesChartProps {
    data: any[]
    period: 'week' | 'month'
}

export function SleepTimesChart({ data, period }: SleepTimesChartProps) {
    const chartData = useMemo(() => {
        // Filter sleep logs
        // We want to map: x = date (or index of day), y = hour of day (0-24)
        // For scatter chart, X usually needs to be a number. We can use timestamps or day index.

        // Let's filter logs based on period range
        const now = new Date()
        const days = period === 'week' ? 7 : 30
        const cutoff = new Date(now.setDate(now.getDate() - days)).getTime()

        const sleepLogs = data
            .filter(log => log.type === 'SLEEP' && log.startTime >= cutoff)
            .map(log => {
                const date = new Date(log.startTime)
                // Y axis: Hour of day + minute fraction
                const hour = date.getHours() + (date.getMinutes() / 60)

                // X axis: Date timestamp (normalized to midnight) or just simple timestamp
                // Using timestamp allows Recharts to format axis
                const dayTimestamp = new Date(date).setHours(0, 0, 0, 0)

                return {
                    x: dayTimestamp,
                    y: hour,
                    type: log.subtype
                }
            })

        return sleepLogs
    }, [data, period])

    return (
        <div className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
            <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-[20px]">schedule</span>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Sleep Schedule</h2>
            </div>

            <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis
                            dataKey="x"
                            type="number"
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => format(new Date(val), "d")}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            tickCount={period === 'week' ? 7 : 10}
                            interval={period === 'week' ? 0 : 'preserveStartEnd'}
                        />
                        <YAxis
                            dataKey="y"
                            type="number"
                            domain={[0, 24]}
                            tickFormatter={(val) => `${Math.floor(val)}:00`}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            reversed={true} // 0 (midnight) at top? usually 0 is bottom. Let's keep 0 bottom (midnight start of day) or top? Time charts usually have morning top. Scatter usually 0 bottom. Let's do 0 bottom (midnight) to 24 (midnight next day).
                        // Actually, baby sleep charts often have 12am at top or bottom. Let's stick to standard: 0 bottom.
                        />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload
                                    const timeStr = format(new Date(data.x).setHours(Math.floor(data.y), (data.y % 1) * 60), "h:mm a")
                                    return (
                                        <div className="bg-white dark:bg-surface-dark p-2 border border-blue-100 dark:border-white/10 rounded-lg shadow-lg text-xs">
                                            <p className="font-semibold">{format(new Date(data.x), "MMM d")}</p>
                                            <p>{data.type}</p>
                                            <p className="text-slate-500">{timeStr}</p>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Scatter name="Sleep" data={chartData} fill="var(--color-secondary)" shape="circle" />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

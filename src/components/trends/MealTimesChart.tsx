"use client"

import { useMemo } from "react"
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { format } from "date-fns"

interface MealTimesChartProps {
    data: any[]
    period: 'week' | 'month'
}

export function MealTimesChart({ data, period }: MealTimesChartProps) {
    const chartData = useMemo(() => {
        // Filter feed logs
        const now = new Date()
        const days = period === 'week' ? 7 : 30
        const cutoff = new Date(now.setDate(now.getDate() - days)).getTime()

        // Map: x = date, y = hour of day (0-24), size = amount
        const feedLogs = data
            .filter(log => log.type === 'FEED' && log.startTime >= cutoff)
            .map(log => {
                const date = new Date(log.startTime)
                const hour = date.getHours() + (date.getMinutes() / 60)
                const amount = parseFloat(log.details?.amount || 2) // Default size if unknown

                return {
                    x: date.setHours(0, 0, 0, 0),
                    y: hour,
                    z: amount, // For bubble size
                    type: log.subtype
                }
            })

        return feedLogs
    }, [data, period])

    return (
        <div className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">restaurant_menu</span>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Meal Times</h2>
                </div>
            </div>

            <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                        margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                    >
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
                            reversed={true} // 0 (midnight) at top? usually 0 is bottom. Let's keep 0 bottom.
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
                                            <p>{data.type} - {data.z}oz</p>
                                            <p className="text-slate-500">{timeStr}</p>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Scatter name="Feeds" data={chartData} fill="var(--color-primary)" shape="circle" />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

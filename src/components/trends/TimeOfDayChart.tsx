"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts"

interface TimeOfDayChartProps {
    data: any[]
}

export function TimeOfDayChart({ data }: TimeOfDayChartProps) {
    const chartData = useMemo(() => {
        // Group by hour of the day (0-23)
        const hourCounts = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            hourLabel: `${i === 0 ? 12 : i > 12 ? i - 12 : i}${i >= 12 ? 'p' : 'a'}`,
            count: 0
        }))

        data.forEach(log => {
            const date = new Date(log.startTime)
            const hour = date.getHours()
            hourCounts[hour].count++
        })

        return hourCounts
    }, [data])

    return (
        <div className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
            <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Activity Time of Day</h2>
            </div>
            <div className="h-48 w-full mt-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis
                            dataKey="hourLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            interval={3} // Show fewer ticks to avoid crowding
                            dy={10}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: 'transparent' }}
                        />
                        <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

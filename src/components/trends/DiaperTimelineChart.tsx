"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"

interface DiaperTimelineChartProps {
    data: any[]
    period: 'week' | 'month'
}

export function DiaperTimelineChart({ data, period }: DiaperTimelineChartProps) {
    const chartData = useMemo(() => {
        // Group by date
        const grouped = new Map<string, { date: string, wet: number, dirty: number, mixed: number }>()

        // Sort logs
        const sortedLogs = [...data].sort((a, b) => a.startTime - b.startTime)

        sortedLogs.forEach(log => {
            if (log.type !== 'DIAPER') return
            const dateKey = format(new Date(log.startTime), "yyyy-MM-dd")

            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, { date: dateKey, wet: 0, dirty: 0, mixed: 0 })
            }

            const entry = grouped.get(dateKey)!
            if (log.subtype === 'wet') entry.wet++
            else if (log.subtype === 'dirty') entry.dirty++
            else entry.mixed++
        })

        return Array.from(grouped.values()).slice(period === 'week' ? -7 : -30)
    }, [data, period])

    return (
        <div className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">timeline</span>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Diaper Timeline</h2>
                </div>
            </div>

            <div className="h-48 w-full mt-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} stackOffset="sign">
                        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(val) => format(new Date(val), "EEEEE")}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: 'transparent' }}
                        />
                        <Bar dataKey="wet" stackId="a" fill="var(--color-pastel-blue)" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="dirty" stackId="a" fill="var(--color-pastel-purple)" />
                        <Bar dataKey="mixed" stackId="a" fill="var(--color-pastel-pink)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

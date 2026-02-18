"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"

interface SleepDurationChartProps {
    data: any[]
    period: 'week' | 'month'
}

export function SleepDurationChart({ data, period }: SleepDurationChartProps) {
    const chartData = useMemo(() => {
        // Determine date range based on period (mock logic: assume data covers the range)
        // For 'week', filter last 7 days. For 'month', last 30 days.
        // Assuming 'data' passed in is already filtered or we filter here.

        // Simplification: Group by day
        const grouped = new Map<string, { date: string, night: number, day: number }>()

        // Sort logs
        const sortedLogs = [...data].sort((a, b) => a.startTime - b.startTime)

        sortedLogs.forEach(log => {
            if (log.type !== 'SLEEP' || !log.endTime) return
            const dateKey = format(new Date(log.startTime), "yyyy-MM-dd")
            const durationHours = (log.endTime - log.startTime) / (1000 * 60 * 60)

            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, { date: dateKey, night: 0, day: 0 })
            }

            const entry = grouped.get(dateKey)!
            // Simple heuristic: night sleep if started after 7pm or before 6am? 
            // Or strictly by subtype if available. Script uses 'night' vs 'nap'.
            if (log.subtype === 'night') {
                entry.night += durationHours
            } else {
                entry.day += durationHours
            }
        })

        return Array.from(grouped.values()).slice(period === 'week' ? -7 : -30)
    }, [data, period])

    const totalSleep = chartData.reduce((acc, curr) => acc + curr.night + curr.day, 0)
    const avgSleep = chartData.length ? totalSleep / chartData.length : 0
    const avgHours = Math.floor(avgSleep)
    const avgMins = Math.round((avgSleep - avgHours) * 60)

    return (
        <div className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-secondary text-[20px]">bedtime</span>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Sleep Duration</h2>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {avgHours}h {avgMins}m
                        </span>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">avg</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Night</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Day</span>
                    </div>
                </div>
            </div>

            <div className="h-48 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={12} stackOffset="sign">
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
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="day" stackId="a" fill="var(--color-secondary)" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="night" stackId="a" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

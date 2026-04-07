"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface ActionFrequencyChartProps {
    data: any[]
    period: 'week' | 'month'
}

import { subDays } from "date-fns"

export function ActionFrequencyChart({ data, period }: ActionFrequencyChartProps) {
    const chartData = useMemo(() => {
        const days = period === 'week' ? 7 : 30
        const cutoffDate = subDays(new Date(), days).getTime()

        let sleepCount = 0
        let feedCount = 0
        let diaperCount = 0
        let activityCount = 0

        data.forEach(log => {
            if (log.startTime < cutoffDate) return

            if (log.type === 'SLEEP') sleepCount++
            else if (log.type === 'FEED') feedCount++
            else if (log.type === 'DIAPER') diaperCount++
            else if (log.type === 'ACTIVITY') activityCount++
        })

        return [
            { name: 'Sleeps', count: Number((sleepCount / days).toFixed(1)), fill: "var(--color-primary)" },
            { name: 'Feeds', count: Number((feedCount / days).toFixed(1)), fill: "#eab308" },
            { name: 'Diapers', count: Number((diaperCount / days).toFixed(1)), fill: "var(--color-pastel-blue)" },
            { name: 'Activities', count: Number((activityCount / days).toFixed(1)), fill: "#10b981" }
        ]
    }, [data, period])

    return (
        <div className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
            <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-[20px]">repeat</span>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Daily Average Frequency</h2>
            </div>
            <div className="h-48 w-full mt-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 20 }}>
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: 'transparent' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

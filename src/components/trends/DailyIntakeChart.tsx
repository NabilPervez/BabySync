"use client"

import { useMemo } from "react"
import { Area, AreaChart, ResponsiveContainer, Defs, LinearGradient, Stop } from "recharts"
import { format } from "date-fns"

interface DailyIntakeChartProps {
    data: any[]
    period: 'week' | 'month'
}

export function DailyIntakeChart({ data, period }: DailyIntakeChartProps) {
    const chartData = useMemo(() => {
        // Process feed data
        const grouped = new Map<string, number>()

        data.forEach(log => {
            if (log.type !== 'FEED') return
            const dateKey = format(new Date(log.startTime), "yyyy-MM-dd")
            const amount = parseFloat(log.details?.amount || 0)
            grouped.set(dateKey, (grouped.get(dateKey) || 0) + amount)
        })

        const result = Array.from(grouped.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        return result.slice(period === 'week' ? -7 : -30)
    }, [data, period])

    const todayAmount = chartData[chartData.length - 1]?.amount || 0

    return (
        <div className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-[20px]">water_drop</span>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Daily Intake</h2>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {todayAmount} oz
                        </span>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">today</span>
                    </div>
                </div>
                {/* Hardcoded trend for now, calculate real diff later */}
                <div className="px-2 py-1 bg-rose-50 rounded text-xs font-medium text-rose-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">trending_down</span>
                    5%
                </div>
            </div>

            <div className="h-40 w-full mt-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="gradientFlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="var(--color-primary)"
                            strokeWidth={3}
                            fill="url(#gradientFlow)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
                <div className="absolute -bottom-6 inset-x-0 flex justify-between px-1">
                    {chartData.map((d, i) => (
                        <span key={i} className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            {format(new Date(d.date), "EEEEE")}
                        </span>
                    ))}
                </div>
            </div>
            <div className="h-4"></div>
        </div>
    )
}

"use client"

import { useMemo } from "react"
import { isSameDay } from "date-fns"

interface DiaperStatsProps {
    data: any[]
}

export function DiaperStats({ data }: DiaperStatsProps) {
    const stats = useMemo(() => {
        // Filter for today
        const today = new Date()
        const todayLogs = data.filter(log =>
            log.type === 'DIAPER' && isSameDay(new Date(log.startTime), today)
        )

        return {
            total: todayLogs.length,
            wet: todayLogs.filter(l => l.subtype === 'wet').length,
            dirty: todayLogs.filter(l => l.subtype === 'dirty').length,
            mixed: todayLogs.filter(l => l.subtype === 'mixed').length
        }
    }, [data])

    return (
        <div className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">layers</span>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Today's Output</h2>
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total: {stats.total}</span>
            </div>
            <div className="flex gap-4">
                <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-pastel-blue/50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-300">
                        <span className="material-symbols-outlined text-[24px]">water_drop</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-2xl font-bold text-slate-800 dark:text-white">{stats.wet}</span>
                        <span className="text-xs font-medium text-blue-500 dark:text-blue-300/80 uppercase tracking-wider">Wet</span>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-pastel-purple/50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-500 dark:text-purple-300">
                        <span className="material-symbols-outlined text-[24px]">pest_control_rodent</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-2xl font-bold text-slate-800 dark:text-white">{stats.dirty + stats.mixed}</span>
                        <span className="text-xs font-medium text-purple-500 dark:text-purple-300/80 uppercase tracking-wider">Dirty</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

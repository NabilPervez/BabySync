"use client"

import { useMemo } from "react"

interface AverageIntervalsProps {
    data: any[]
}

export function AverageIntervals({ data }: AverageIntervalsProps) {
    const stats = useMemo(() => {
        const sortedLogs = [...data].sort((a, b) => a.startTime - b.startTime)

        let diaperCount = 0
        let diaperTotalTime = 0
        let lastDiaperTime: number | null = null

        let feedCount = 0
        let feedTotalTime = 0
        let lastFeedTime: number | null = null

        sortedLogs.forEach(log => {
            if (log.type === 'DIAPER') {
                if (lastDiaperTime !== null) {
                    diaperTotalTime += (log.startTime - lastDiaperTime)
                    diaperCount++
                }
                lastDiaperTime = log.startTime
            } else if (log.type === 'FEED') {
                if (lastFeedTime !== null) {
                    feedTotalTime += (log.startTime - lastFeedTime)
                    feedCount++
                }
                lastFeedTime = log.startTime
            }
        })

        const avgDiaperMs = diaperCount > 0 ? diaperTotalTime / diaperCount : 0
        const avgFeedMs = feedCount > 0 ? feedTotalTime / feedCount : 0

        const formatTime = (ms: number) => {
            if (ms === 0) return "--"
            const hours = Math.floor(ms / (1000 * 60 * 60))
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
            if (hours > 0) return `${hours}h ${minutes}m`
            return `${minutes}m`
        }

        return {
            avgDiaper: formatTime(avgDiaperMs),
            avgFeed: formatTime(avgFeedMs)
        }
    }, [data])

    return (
        <div className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
            <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Average Intervals</h2>
            </div>
            <div className="flex gap-4">
                <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Between Diapers</span>
                    <span className="block text-2xl font-bold text-slate-800 dark:text-white">{stats.avgDiaper}</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-yellow-50/50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Between Feeds</span>
                    <span className="block text-2xl font-bold text-slate-800 dark:text-white">{stats.avgFeed}</span>
                </div>
            </div>
        </div>
    )
}

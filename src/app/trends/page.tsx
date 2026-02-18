"use client"

import { useState, useEffect } from "react"
import { BottomNav } from "@/components/BottomNav"
import { SleepDurationChart } from "@/components/trends/SleepDurationChart"
import { DailyIntakeChart } from "@/components/trends/DailyIntakeChart"
import { DiaperStats } from "@/components/trends/DiaperStats"

// Import logic hooks or just fetch data directly
// Since we have fake-data.json, let's fetch it for now to hydrate the charts
// In a real app we'd query Dexie with complex aggregations or a specialized hook

export default function TrendsPage() {
    const [data, setData] = useState<any[]>([])
    const [period, setPeriod] = useState<'week' | 'month'>('week')

    useEffect(() => {
        fetch('/fake-data.json')
            .then(res => res.json())
            .then(setData)
    }, [])

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white antialiased selection:bg-primary/30 h-full w-full">
            <div className="relative flex h-full w-full flex-col overflow-hidden max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark">
                {/* Header */}
                <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-12 pb-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-blue-100 dark:border-white/5 safe-top">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Trends</h1>
                    <button
                        onClick={() => setPeriod(period === 'week' ? 'month' : 'week')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                        <span>{period === 'week' ? 'Last 7 Days' : 'Last 30 Days'}</span>
                        <span className="material-symbols-outlined text-[16px]">expand_more</span>
                    </button>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto flex flex-col gap-6 px-4 py-6 pb-24 relative z-10 no-scrollbar">
                    <SleepDurationChart data={data} period={period} />
                    <DailyIntakeChart data={data} period={period} />
                    <DiaperStats data={data} />
                </main>

                <BottomNav />
            </div>
        </div>
    )
}

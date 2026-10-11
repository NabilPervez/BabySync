"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { BottomNav } from "@/components/BottomNav"
import { SleepDurationChart } from "@/components/trends/SleepDurationChart"
import { SleepTimesChart } from "@/components/trends/SleepTimesChart"
import { DailyIntakeChart } from "@/components/trends/DailyIntakeChart"
import { MealTimesChart } from "@/components/trends/MealTimesChart"
import { DiaperStats } from "@/components/trends/DiaperStats"
import { DiaperTimelineChart } from "@/components/trends/DiaperTimelineChart"
import { AverageIntervals } from "@/components/trends/AverageIntervals"
import { ActionFrequencyChart } from "@/components/trends/ActionFrequencyChart"
import { TimeOfDayChart } from "@/components/trends/TimeOfDayChart"
import { ActivityBreakdown } from "@/components/trends/ActivityBreakdown"

export default function TrendsPage() {
    const [period, setPeriod] = useState<'week' | 'month'>('week')
    // Only load what the selected period needs instead of the whole database
    const data = useLiveQuery(
        () => db.logs.where("startTime").above(Date.now() - (period === 'week' ? 8 : 31) * 86400_000).toArray(),
        [period]
    ) ?? []

    return (
        <div className="finals-page">
            <header className="finals-header">
                <h1 className="finals-heading text-3xl">Trends</h1>
                <div className="flex" role="group" aria-label="Period">
                    {(['week', 'month'] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className="finals-chip text-xs" data-active={period === p} aria-pressed={period === p}>
                            {p === 'week' ? '7 days' : '30 days'}
                        </button>
                    ))}
                </div>
            </header>

            <main className="finals-main flex flex-col gap-5">
                <ActivityBreakdown data={data} period={period} />
                <SleepDurationChart data={data} period={period} />
                <SleepTimesChart data={data} period={period} />
                <DailyIntakeChart data={data} period={period} />
                <MealTimesChart data={data} period={period} />
                <DiaperStats data={data} />
                <DiaperTimelineChart data={data} period={period} />
                <AverageIntervals data={data} />
                <ActionFrequencyChart data={data} period={period} />
                <TimeOfDayChart data={data} />
            </main>

            <BottomNav />
        </div>
    )
}

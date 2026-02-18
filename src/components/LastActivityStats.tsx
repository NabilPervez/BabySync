"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { format } from "date-fns"

export function LastActivityStats() {
    const lastDiaper = useLiveQuery(() => db.logs.where('type').equals('DIAPER').reverse().first())
    const lastFeed = useLiveQuery(() => db.logs.where('type').equals('FEED').reverse().first())
    const lastSleep = useLiveQuery(() => db.logs.where('type').equals('SLEEP').reverse().first())

    const formatTime = (timestamp?: number) => {
        if (!timestamp) return "--:--"
        return format(new Date(timestamp), "h:mm a")
    }

    // specific logic for sleep: if currently sleeping (no endTime), maybe show "Sleeping"
    // User asked for "Last Slept At [Time]". 
    // If sleeping, the last sleep event *started* at startTime.
    // If awake, the last sleep event *ended* at endTime.
    const sleepTimeDisplay = lastSleep?.endTime
        ? formatTime(lastSleep.endTime)
        : (lastSleep ? "Sleeping" : "--:--")

    return (
        <div className="grid grid-cols-3 gap-2 mb-4">
            <ActivityCard
                icon="water_drop"
                label="Last Diaper"
                time={formatTime(lastDiaper?.startTime)}
                colorClass="text-blue-500 bg-blue-50 dark:bg-blue-500/20"
            />
            <ActivityCard
                icon="restaurant"
                label="Last Ate"
                time={formatTime(lastFeed?.startTime)}
                colorClass="text-orange-500 bg-orange-50 dark:bg-orange-500/20"
            />
            <ActivityCard
                icon="bedtime"
                label="Last Slept"
                time={sleepTimeDisplay}
                colorClass="text-indigo-500 bg-indigo-50 dark:bg-indigo-500/20"
            />
        </div>
    )
}

function ActivityCard({ icon, label, time, colorClass }: { icon: string, label: string, time: string, colorClass: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5">
            <div className={`p-1.5 rounded-full mb-1 ${colorClass}`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </div>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center leading-none mb-1">{label}</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap">{time}</span>
        </div>
    )
}

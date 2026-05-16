"use client"

import { useState, useEffect } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { format, formatDistanceToNowStrict, addHours, differenceInMinutes } from "date-fns"

export function LastActivityStats() {
    const lastDiaper = useLiveQuery(() => db.logs.where('type').equals('DIAPER').reverse().first())
    const lastFeed = useLiveQuery(() => db.logs.where('type').equals('FEED').reverse().first())
    const lastSleep = useLiveQuery(() => db.logs.where('type').equals('SLEEP').reverse().first())
    const lastMedicine = useLiveQuery(() => db.logs.where('type').equals('MEDICINE').reverse().first())

    const [, setTick] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000) // Update every minute
        return () => clearInterval(interval)
    }, [])

    const formatTime = (timestamp?: number) => {
        if (!timestamp) return { time: "--:--", timeAgo: "" }
        return {
            time: format(new Date(timestamp), "h:mm a"),
            timeAgo: formatDistanceToNowStrict(new Date(timestamp)) + " ago"
        }
    }

    const diaperInfo = formatTime(lastDiaper?.startTime)
    const feedInfo = formatTime(lastFeed?.startTime)
    const medicineInfo = formatTime(lastMedicine?.startTime)

    let sleepTimeDisplay = "--:--"
    let sleepTimeAgo = ""
    if (lastSleep) {
        if (lastSleep.endTime) {
            sleepTimeDisplay = format(new Date(lastSleep.endTime), "h:mm a")
            sleepTimeAgo = formatDistanceToNowStrict(new Date(lastSleep.endTime)) + " ago"
        } else {
            sleepTimeDisplay = "Sleeping"
            sleepTimeAgo = formatDistanceToNowStrict(new Date(lastSleep.startTime))
        }
    }

    // Medicine countdown logic
    let medicineBanner = null
    if (lastMedicine?.startTime) {
        const sixHoursLater = addHours(new Date(lastMedicine.startTime), 6)
        const minsUntilNext = differenceInMinutes(sixHoursLater, new Date())

        if (minsUntilNext > 0) {
            const hours = Math.floor(minsUntilNext / 60)
            const mins = minsUntilNext % 60
            const nextBrand = lastMedicine.subtype?.toLowerCase() === 'motrin' ? 'Tylenol' :
                              lastMedicine.subtype?.toLowerCase() === 'tylenol' ? 'Motrin' : 'Medicine'

            let timeString = ""
            if (hours > 0) timeString += `${hours}h `
            timeString += `${mins}m`

            medicineBanner = (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-500">medication</span>
                        <span className="text-sm font-medium text-rose-700 dark:text-rose-300">Wait to give {nextBrand}</span>
                    </div>
                    <span className="text-sm font-bold text-rose-700 dark:text-rose-300">{timeString}</span>
                </div>
            )
        }
    }

    return (
        <div>
            {medicineBanner}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <ActivityCard
                    icon="water_drop"
                    label="Last Diaper"
                    time={diaperInfo.time}
                    timeAgo={diaperInfo.timeAgo}
                    colorClass="text-blue-500 bg-blue-50 dark:bg-blue-500/20"
                />
                <ActivityCard
                    icon="restaurant"
                    label="Last Ate"
                    time={feedInfo.time}
                    timeAgo={feedInfo.timeAgo}
                    colorClass="text-orange-500 bg-orange-50 dark:bg-orange-500/20"
                />
                <ActivityCard
                    icon="bedtime"
                    label="Last Slept"
                    time={sleepTimeDisplay}
                    timeAgo={sleepTimeAgo}
                    colorClass="text-indigo-500 bg-indigo-50 dark:bg-indigo-500/20"
                />
                <ActivityCard
                    icon="vaccines"
                    label="Last Medicine"
                    time={medicineInfo.time}
                    timeAgo={medicineInfo.timeAgo}
                    colorClass="text-rose-500 bg-rose-50 dark:bg-rose-500/20"
                />
            </div>
        </div>
    )
}

function ActivityCard({ icon, label, time, timeAgo, colorClass }: { icon: string, label: string, time: string, timeAgo: string, colorClass: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5">
            <div className={`p-1.5 rounded-full mb-1 ${colorClass}`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </div>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center leading-none mb-1">{label}</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap">{time}</span>
            {timeAgo && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{timeAgo}</span>
            )}
        </div>
    )
}

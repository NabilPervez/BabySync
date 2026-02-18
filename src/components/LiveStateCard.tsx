"use client"

import { useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { differenceInMilliseconds, intervalToDuration } from "date-fns"

export function LiveStateCard() {
    const lastSleep = useLiveQuery(async () => {
        const logs = await db.logs
            .where("type")
            .equals("SLEEP")
            .reverse()
            .sortBy("startTime")
        return logs[0]
    })

    const isSleeping = lastSleep && !lastSleep.endTime
    const startTime = isSleeping ? lastSleep.startTime : (lastSleep?.endTime || Date.now())

    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsed(Date.now() - startTime)
        }, 1000)
        return () => clearInterval(timer)
    }, [startTime])

    const formatTime = (ms: number) => {
        const duration = intervalToDuration({ start: 0, end: ms })
        // Format: 1h 45m or 45m 10s
        if (duration.hours) {
            return `${duration.hours}h ${duration.minutes}m`
        }
        return `${duration.minutes || 0}m ${duration.seconds || 0}s`
    }

    const handleToggleSleep = async () => {
        if (isSleeping) {
            if (lastSleep) {
                await db.logs.update(lastSleep.id, { endTime: Date.now() })
            }
        } else {
            await db.logs.add({
                type: "SLEEP",
                startTime: Date.now(),
                createdAt: Date.now(),
            })
        }
    }

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-md shadow-blue-900/5 ring-1 ring-slate-900/5 dark:ring-white/10 p-5">
            <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full blur-3xl ${isSleeping ? 'bg-indigo-500/20' : 'bg-blue-400/20'}`}></div>
            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-primary">
                            <span className={`material-symbols-outlined text-[20px] fill-1 ${isSleeping ? 'text-accent-lavender' : 'text-accent-yellow'}`}>
                                {isSleeping ? 'bedtime' : 'wb_sunny'}
                            </span>
                            <span className="text-sm font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-300">
                                {isSleeping ? 'Sleeping' : 'Awake'}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                            {formatTime(elapsed)}
                        </h2>
                    </div>

                    <div className="w-12 h-12 rounded-full border-2 border-blue-100 dark:border-blue-900 flex items-center justify-center relative">
                        <div
                            className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"
                            style={{ animationDuration: '3s' }}
                        ></div>
                        <span className="material-symbols-outlined text-primary">schedule</span>
                    </div>
                </div>

                <div className="h-px w-full bg-slate-100 dark:bg-slate-700"></div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleToggleSleep}
                        className={`flex-1 h-12 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-white
                ${isSleeping
                                ? 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30'
                                : 'bg-primary hover:bg-blue-500 shadow-blue-500/30'
                            }`}
                    >
                        <span className="material-symbols-outlined">
                            {isSleeping ? 'wb_sunny' : 'bedtime'}
                        </span>
                        {isSleeping ? 'Wake Up' : 'Start Sleep'}
                    </button>
                    {/* Pencil removed */}
                </div>
            </div>
        </div>
    )
}

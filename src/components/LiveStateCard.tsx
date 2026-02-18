"use client"

import { useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Moon, Sun } from "lucide-react"
import { differenceInMilliseconds, formatDuration, intervalToDuration } from "date-fns"

export function LiveStateCard() {
    const lastSleep = useLiveQuery(async () => {
        // Get the most recent sleep log
        const logs = await db.logs
            .where("type")
            .equals("SLEEP")
            .reverse()
            .sortBy("startTime")
        return logs[0]
    })

    // Determine state
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
        return `${duration.hours || 0}h ${duration.minutes || 0}m ${duration.seconds || 0}s`
    }

    const handleToggleSleep = async () => {
        if (isSleeping) {
            // Wake up: update the sleep log with endTime
            if (lastSleep) {
                await db.logs.update(lastSleep.id, { endTime: Date.now() })
            }
        } else {
            // Start sleep: create new log
            await db.logs.add({
                type: "SLEEP",
                startTime: Date.now(),
                createdAt: Date.now(),
            })
        }
    }

    return (
        <Card className={`border-none shadow-lg transition-colors duration-500 ${isSleeping ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}>
            <CardContent className="flex flex-col items-center justify-center py-8 space-y-6">
                <div className={`p-4 rounded-full ${isSleeping ? "bg-indigo-500/20" : "bg-orange-100"}`}>
                    {isSleeping ? <Moon className="w-8 h-8 text-indigo-300" /> : <Sun className="w-8 h-8 text-orange-400" />}
                </div>

                <div className="text-center space-y-1">
                    <p className={`text-sm font-medium ${isSleeping ? "text-indigo-200" : "text-slate-500"}`}>
                        {isSleeping ? "Sleeping for" : "Awake for"}
                    </p>
                    <h2 className="text-4xl font-bold tracking-tight font-mono">
                        {formatTime(elapsed)}
                    </h2>
                </div>

                <Button
                    size="lg"
                    onClick={handleToggleSleep}
                    className={`w-full max-w-xs font-semibold text-lg h-14 rounded-xl transition-all ${isSleeping
                            ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/25"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25"
                        }`}
                >
                    {isSleeping ? "Wake Up" : "Start Sleep"}
                </Button>
            </CardContent>
        </Card>
    )
}

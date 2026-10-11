"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfDay } from "date-fns"
import { BottomNav } from "@/components/BottomNav"
import { Timeline } from "@/components/Timeline"
import { AddActivityDrawer } from "@/components/AddActivityDrawer"
import { db, type Log } from "@/lib/db"

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(() => new Date())
    const [selectedDate, setSelectedDate] = useState(() => new Date())
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editingLog, setEditingLog] = useState<Log | null>(null)

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Days that have at least one entry get a dot
    const activeDays = useLiveQuery(async () => {
        const keys = await db.logs.where("startTime").between(monthStart.getTime(), monthEnd.getTime(), true, true).keys()
        return new Set(keys.map(k => startOfDay(k as number).getTime()))
    }, [monthStart.getTime()])

    return (
        <div className="finals-page">
            <header className="finals-header">
                <h1 className="finals-heading text-3xl">History</h1>
            </header>

            <main className="finals-main space-y-5">
                <section className="finals-card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="finals-btn finals-btn-ghost px-3" aria-label="Previous month">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <h2 className="finals-heading text-xl">{format(currentMonth, "MMMM yyyy")}</h2>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="finals-btn finals-btn-ghost px-3" aria-label="Next month">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center finals-label mb-1">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`pad-${i}`} />)}
                        {days.map(day => {
                            const selected = isSameDay(day, selectedDate)
                            const today = isSameDay(day, new Date())
                            const hasLogs = activeDays?.has(day.getTime())
                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className="finals-day"
                                    data-selected={selected}
                                    data-today={today}
                                    aria-pressed={selected}
                                    aria-label={format(day, "EEEE MMMM d")}
                                >
                                    {format(day, "d")}
                                    {hasLogs && <span className="finals-day-dot" />}
                                </button>
                            )
                        })}
                    </div>
                </section>

                <section>
                    <h3 className="finals-heading text-xl mb-3">{format(selectedDate, "EEEE, MMM d")}</h3>
                    <Timeline onEdit={log => { setEditingLog(log); setDrawerOpen(true) }} date={selectedDate} />
                </section>
            </main>

            <AddActivityDrawer open={drawerOpen} onOpenChange={setDrawerOpen} defaultValues={editingLog} />
            <BottomNav />
        </div>
    )
}

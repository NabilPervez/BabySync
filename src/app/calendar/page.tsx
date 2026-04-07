"use client"

import { useState } from "react"
import { BottomNav } from "@/components/BottomNav"
import { Timeline } from "@/components/Timeline"
import { AddActivityDrawer } from "@/components/AddActivityDrawer"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns"

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editingLog, setEditingLog] = useState<any>(null)

    const handleEditLog = (log: any) => {
        setEditingLog(log)
        setDrawerOpen(true)
    }

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfMonth(monthStart) // Assuming calendar shows full month only
    const endDate = endOfMonth(monthEnd)

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate
    })

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white h-full w-full flex flex-col overflow-hidden relative font-[var(--font-display)]">
            <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-12 pb-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-blue-100 dark:border-white/5 safe-top">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Calendar</h1>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10">
                <div className="px-5 mt-6 mb-4 flex items-center justify-between">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <h2 className="text-lg font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>

                <div className="px-5 mb-8">
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty padding for start of month */}
                        {Array.from({ length: startDate.getDay() }).map((_, i) => (
                            <div key={`empty-${i}`} className="p-2"></div>
                        ))}
                        {days.map((day, i) => {
                            const isSelected = isSameDay(day, selectedDate)
                            const isToday = isSameDay(day, new Date())
                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={`p-2 rounded-full flex items-center justify-center aspect-square text-sm font-medium transition-all
                                        ${isSelected ? 'bg-primary text-white shadow-md shadow-blue-500/30' :
                                          isToday ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold' :
                                          'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                >
                                    {format(day, 'd')}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="px-5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">
                        Logs for {format(selectedDate, "MMM d, yyyy")}
                    </h3>
                    <Timeline onEdit={handleEditLog} date={selectedDate} />
                </div>
            </main>

            <AddActivityDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                defaultValues={editingLog}
            />
            <BottomNav />
        </div>
    )
}

"use client"
import { useLiveQuery } from "dexie-react-hooks"
import { format, startOfDay, endOfDay, isToday } from "date-fns"
import { db, type Log } from "@/lib/db"
import { getCategory, logIcon, logSummary, logTitle } from "@/lib/log-types"

export function Timeline({ onEdit, onShare, date }: { onEdit: (log: Log) => void, onShare?: (log: Log) => void, date?: Date }) {
    const dayKey = date ? startOfDay(date).getTime() : undefined
    const logs = useLiveQuery(() => {
        if (dayKey !== undefined) {
            return db.logs.where("startTime").between(dayKey, endOfDay(dayKey).getTime(), true, true).reverse().toArray()
        }
        return db.logs.orderBy("startTime").reverse().limit(60).toArray()
    }, [dayKey])

    if (!logs) return <p className="text-center p-4 text-[var(--finals-muted)] animate-pulse">Loading…</p>
    if (logs.length === 0) {
        return (
            <div className="finals-inset text-center p-8">
                <span className="material-symbols-outlined text-4xl text-[var(--finals-muted)]">inbox</span>
                <p className="mt-2 text-[var(--finals-muted)]">Nothing logged{date ? " this day" : " yet"}. Tap <b className="text-[var(--finals-text)]">+</b> to start.</p>
            </div>
        )
    }

    // Group by day so long histories stay readable
    const groups: { day: number, items: Log[] }[] = []
    for (const log of logs) {
        const day = startOfDay(log.startTime).getTime()
        const g = groups[groups.length - 1]
        if (g && g.day === day) g.items.push(log)
        else groups.push({ day, items: [log] })
    }

    return (
        <div className="space-y-6">
            {groups.map(g => (
                <section key={g.day}>
                    {!date && (
                        <h3 className="finals-label mb-2">
                            {isToday(g.day) ? "Today" : format(g.day, "EEEE, MMM d")}
                        </h3>
                    )}
                    <ul className="space-y-2">
                        {g.items.map(log => {
                            const cat = getCategory(log.type)
                            const summary = logSummary(log)
                            return (
                                <li key={log.id} className="finals-row" style={{ "--tile": cat.color } as React.CSSProperties}>
                                    <button onClick={() => onEdit(log)} className="flex flex-1 items-center gap-3 min-w-0 text-left p-3" aria-label={`Edit ${logTitle(log)} at ${format(log.startTime, "h:mm a")}`}>
                                        <span className="w-14 shrink-0 text-right tabular-nums">
                                            <span className="block font-bold text-sm">{format(log.startTime, "h:mm")}</span>
                                            <span className="block text-[10px] uppercase text-[var(--finals-muted)]">{format(log.startTime, "a")}</span>
                                        </span>
                                        <span className="finals-icon shrink-0">
                                            <span className="material-symbols-outlined text-[20px]">{logIcon(log)}</span>
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block font-bold uppercase tracking-wide text-sm truncate">{logTitle(log)}</span>
                                            {summary && <span className="block text-xs text-[var(--finals-muted)] truncate">{summary}</span>}
                                        </span>
                                    </button>
                                    {onShare && (
                                        <button onClick={() => onShare(log)} className="p-3 text-[var(--finals-muted)] hover:text-[var(--finals-text)]" aria-label="Share this update">
                                            <span className="material-symbols-outlined text-[20px]">ios_share</span>
                                        </button>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </section>
            ))}
        </div>
    )
}

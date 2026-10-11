"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { format, formatDistanceToNowStrict, startOfDay } from "date-fns"
import { db, latestOfType, type LogType } from "@/lib/db"
import { MED_INTERVAL_HOURS, formatMinutes, getCategory } from "@/lib/log-types"
import { useNow } from "@/components/LiveStateCard"

const TILES: { type: LogType, label: string }[] = [
    { type: "FEED", label: "Last ate" },
    { type: "DIAPER", label: "Last potty" },
    { type: "ACTIVITY", label: "Last played" },
    { type: "MEDICINE", label: "Last meds" },
]

export function LastActivityStats({ onQuickLog }: { onQuickLog?: (type: LogType) => void }) {
    const now = useNow(30_000)
    const latest = useLiveQuery(async () => {
        const entries = await Promise.all(TILES.map(t => latestOfType(t.type)))
        return Object.fromEntries(TILES.map((t, i) => [t.type, entries[i]]))
    })
    // Every med given in the last 8h, so each one gets its own "next dose" countdown
    const recentMeds = useLiveQuery(() =>
        db.logs.where("[type+startTime]").between(["MEDICINE", Date.now() - 8 * 3600_000], ["MEDICINE", Infinity]).toArray()
    )

    // Everything touching today (incl. last night's sleep that ended this morning)
    const dayStart = startOfDay(now).getTime()
    const recent = useLiveQuery(
        () => db.logs.where("startTime").above(dayStart - 18 * 3600_000).toArray(),
        [dayStart]
    )
    const today = (recent ?? []).filter(l => l.startTime >= dayStart || (l.endTime ?? now) >= dayStart)
    const span = (types: string[]) => today
        .filter(l => types.includes(l.type))
        .reduce((sum, l) => sum + ((l.endTime ?? now) - Math.max(l.startTime, dayStart)) / 60000, 0)
    const count = (t: string) => today.filter(l => l.type === t && l.startTime >= dayStart).length
    const totals = [
        { label: "Sleep", value: formatMinutes(span(["SLEEP"])), color: "var(--finals-pink)" },
        { label: "Meals", value: String(count("FEED")), color: "var(--finals-yellow)" },
        { label: "Potty", value: String(count("DIAPER")), color: "var(--finals-white)" },
        { label: "Play", value: formatMinutes(span(["ACTIVITY"])), color: "var(--finals-cyan)" },
    ]

    const latestByMed = new Map<string, number>()
    for (const m of recentMeds ?? []) {
        if (!m.subtype || !MED_INTERVAL_HOURS[m.subtype]) continue
        latestByMed.set(m.subtype, Math.max(latestByMed.get(m.subtype) ?? 0, m.startTime))
    }
    const waits = [...latestByMed.entries()]
        .map(([med, given]) => ({ med, nextAt: given + MED_INTERVAL_HOURS[med] * 3600_000 }))
        .filter(w => w.nextAt > now)

    return (
        <div className="space-y-3">
            <section aria-label="Today so far" className="finals-card grid grid-cols-4 divide-x divide-[var(--finals-line)]">
                {totals.map(t => (
                    <div key={t.label} className="py-3 text-center">
                        <span className="finals-heading block text-2xl tabular-nums" style={{ color: t.color }}>{t.value}</span>
                        <span className="finals-label block mt-1">{t.label} today</span>
                    </div>
                ))}
            </section>
            {waits.map(w => {
                const mins = Math.ceil((w.nextAt - now) / 60000)
                return (
                    <div key={w.med} className="finals-inset flex items-center gap-3 p-3" style={{ borderLeft: "4px solid var(--finals-red)" }}>
                        <span className="material-symbols-outlined text-[var(--finals-red)]">medication</span>
                        <span className="flex-1 text-sm">
                            Next <b className="capitalize">{w.med}</b> OK at {format(w.nextAt, "h:mm a")}
                        </span>
                        <span className="font-bold tabular-nums text-sm">{Math.floor(mins / 60)}h {mins % 60}m</span>
                    </div>
                )
            })}
            <div className="grid grid-cols-2 gap-2">
                {TILES.map(t => {
                    const log = latest?.[t.type]
                    const cat = getCategory(t.type)
                    return (
                        <button
                            key={t.type}
                            onClick={() => onQuickLog?.(t.type)}
                            className="finals-card p-3 text-left flex items-center gap-3"
                            style={{ "--tile": cat.color } as React.CSSProperties}
                            aria-label={`${t.label}. Tap to log ${cat.label}`}
                        >
                            <span className="finals-icon"><span className="material-symbols-outlined text-[20px]">{cat.icon}</span></span>
                            <span className="min-w-0">
                                <span className="finals-label block">{t.label}</span>
                                <span className="block font-bold tabular-nums">{log ? format(log.startTime, "h:mm a") : "—"}</span>
                                {log && <span className="block text-[11px] text-[var(--finals-muted)]">{formatDistanceToNowStrict(log.startTime)} ago</span>}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

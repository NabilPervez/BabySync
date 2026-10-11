"use client"

import { useMemo } from "react"
import type { Log } from "@/lib/db"
import { useNow } from "@/components/LiveStateCard"
import { formatMinutes, getCategory } from "@/lib/log-types"

/** Time spent per activity (walks, play, reading...) over the period. */
export function ActivityBreakdown({ data, period }: { data: Log[], period: "week" | "month" }) {
    const now = useNow(60_000)
    const rows = useMemo(() => {
        const since = now - (period === "week" ? 7 : 30) * 86400_000
        const totals = new Map<string, { count: number, mins: number }>()
        for (const l of data) {
            if (l.type !== "ACTIVITY" || l.startTime < since) continue
            const t = totals.get(l.subtype ?? "other") ?? { count: 0, mins: 0 }
            t.count++
            if (l.endTime) t.mins += (l.endTime - l.startTime) / 60000
            totals.set(l.subtype ?? "other", t)
        }
        const subs = getCategory("ACTIVITY").subtypes
        return [...totals.entries()]
            .map(([sub, t]) => ({ ...t, sub: subs.find(s => s.value === sub) ?? { value: sub, label: sub, icon: "toys" } }))
            .sort((a, b) => b.mins - a.mins || b.count - a.count)
    }, [data, period, now])

    const max = Math.max(1, ...rows.map(r => r.mins))

    return (
        <section className="finals-card p-5" style={{ "--tile": "var(--finals-cyan)" } as React.CSSProperties}>
            <h2 className="finals-heading text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--finals-cyan)]">toys</span> Play &amp; activities
            </h2>
            {rows.length === 0 ? (
                <p className="text-sm text-[var(--finals-muted)]">No activities logged in this period yet.</p>
            ) : (
                <ul className="space-y-3">
                    {rows.map(r => (
                        <li key={r.sub.value}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-bold uppercase tracking-wide">{r.sub.label}</span>
                                <span className="text-[var(--finals-muted)] tabular-nums">{r.count}× · {formatMinutes(r.mins)}</span>
                            </div>
                            <div className="h-2 bg-[var(--finals-line)]">
                                <div className="h-full bg-[var(--finals-cyan)]" style={{ width: `${(r.mins / max) * 100}%` }} />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

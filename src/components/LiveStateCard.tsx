"use client"

import { useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, latestOfType } from "@/lib/db"
import { formatMinutes, getSubtype, guessSleepSubtype } from "@/lib/log-types"

export function useNow(intervalMs = 1000) {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), intervalMs)
        return () => clearInterval(t)
    }, [intervalMs])
    return now
}

function clock(ms: number) {
    const s = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (n: number) => String(n).padStart(2, "0")
    return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

async function startActivity(subtype: string) {
    const t = Date.now()
    await db.logs.add({ type: "ACTIVITY", subtype, startTime: t, createdAt: t })
}

const stop = (id: number) => db.logs.update(id, { endTime: Date.now() })

export function LiveStateCard() {
    const now = useNow()
    const lastSleep = useLiveQuery(() => latestOfType("SLEEP"))
    // Timed activities (walks, play) that were started but not ended
    const running = useLiveQuery(() =>
        db.logs.where("type").equals("ACTIVITY").filter(l => !l.endTime).toArray()
    )

    const isSleeping = !!lastSleep && !lastSleep.endTime
    const since = isSleeping ? lastSleep!.startTime : lastSleep?.endTime

    const toggleSleep = async () => {
        if (isSleeping) {
            await db.logs.update(lastSleep!.id, { endTime: Date.now() })
        } else {
            const t = Date.now()
            await db.logs.add({ type: "SLEEP", subtype: guessSleepSubtype(t), startTime: t, createdAt: t })
        }
    }

    return (
        <section className="finals-card finals-card-accent p-5" style={{ "--tile": isSleeping ? "var(--finals-pink)" : "var(--finals-yellow)" } as React.CSSProperties}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="finals-label flex items-center gap-1.5" style={{ color: "var(--tile)" }}>
                        <span className="material-symbols-outlined text-[18px]">{isSleeping ? "bedtime" : "bolt"}</span>
                        {isSleeping ? `${getSubtype(lastSleep!)?.label ?? "Sleep"} in progress` : "Awake for"}
                    </p>
                    <p className="finals-heading text-5xl tabular-nums mt-1" aria-live="off">
                        {since ? clock(now - since) : "--:--"}
                    </p>
                    {!since && <p className="text-xs text-[var(--finals-muted)] mt-1">Tap the button when they fall asleep</p>}
                </div>
            </div>

            <button onClick={toggleSleep} className="finals-btn finals-btn-primary w-full mt-4 text-lg" style={isSleeping ? { background: "var(--finals-pink)" } : undefined}>
                <span className="material-symbols-outlined">{isSleeping ? "wb_sunny" : "bedtime"}</span>
                {isSleeping ? "Woke up" : "Start sleep"}
            </button>

            {running && running.length > 0 && (
                <ul className="mt-4 space-y-2">
                    {running.map(a => (
                        <li key={a.id} className="flex items-center gap-3 p-3 finals-inset">
                            <span className="material-symbols-outlined text-[var(--finals-cyan)]">{getSubtype(a)?.icon ?? "toys"}</span>
                            <span className="flex-1 font-bold uppercase tracking-wide text-sm">
                                {getSubtype(a)?.label ?? "Activity"} · <span className="tabular-nums">{formatMinutes((now - a.startTime) / 60000)}</span>
                            </span>
                            <button onClick={() => stop(a.id)} className="finals-chip" data-active="true" style={{ "--tile": "var(--finals-cyan)" } as React.CSSProperties}>
                                Done
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {!isSleeping && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                    {[
                        { sub: "walk", icon: "directions_walk", label: "Walk" },
                        { sub: "play_inside", icon: "toys", label: "Play" },
                        { sub: "play_outside", icon: "park", label: "Outside" },
                    ].map(b => (
                        <button key={b.sub} onClick={() => startActivity(b.sub)} className="finals-btn finals-btn-ghost text-sm" aria-label={`Start ${b.label} timer`}>
                            <span className="material-symbols-outlined text-[20px] text-[var(--finals-cyan)]">{b.icon}</span>
                            {b.label}
                        </button>
                    ))}
                </div>
            )}
        </section>
    )
}

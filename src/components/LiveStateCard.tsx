"use client"

import { useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, latestOfType, type Log, type LogType } from "@/lib/db"
import { addLog, updateLog } from "@/lib/data"
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

async function toggleSleep(lastSleep: Log | undefined) {
    if (lastSleep && !lastSleep.endTime) {
        await updateLog(lastSleep.id, { endTime: Date.now() })
    } else {
        const t = Date.now()
        await addLog({ type: "SLEEP", subtype: guessSleepSubtype(t), startTime: t, createdAt: t })
    }
}

const stop = (id: number) => updateLog(id, { endTime: Date.now() })

/** The five everyday buttons, in the order parents reach for them. */
const QUICK: { type: LogType, label: string, icon: string, color: string }[] = [
    { type: "SLEEP", label: "Sleep", icon: "bedtime", color: "var(--finals-pink)" },
    { type: "MEDICINE", label: "Meds", icon: "medication", color: "var(--finals-red)" },
    { type: "FEED", label: "Eat", icon: "restaurant", color: "var(--finals-yellow)" },
    { type: "DIAPER", label: "Potty", icon: "wc", color: "var(--finals-white)" },
    { type: "ACTIVITY", label: "Play", icon: "toys", color: "var(--finals-cyan)" },
]

export function LiveStateCard({ onQuickLog }: { onQuickLog: (type: LogType) => void }) {
    const now = useNow()
    const lastSleep = useLiveQuery(() => latestOfType("SLEEP"))
    // Timed activities (walks, play) that were started but not ended
    const running = useLiveQuery(() =>
        db.logs.where("type").equals("ACTIVITY").filter(l => !l.endTime).toArray()
    )

    const isSleeping = !!lastSleep && !lastSleep.endTime
    const since = isSleeping ? lastSleep!.startTime : lastSleep?.endTime


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
                    {isSleeping && now - since! > 14 * 3600_000 && (
                        <p className="text-xs font-semibold text-[var(--finals-yellow)] mt-1">Over 14h — forgot to tap &ldquo;Woke up&rdquo;? Edit it in the timeline.</p>
                    )}
                    {!since && <p className="text-xs text-[var(--finals-muted)] mt-1">Tap Sleep when they fall asleep</p>}
                </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 mt-4">
                {QUICK.map(q => {
                    const sleepBtn = q.type === "SLEEP"
                    const label = sleepBtn && isSleeping ? "Woke up" : q.label
                    return (
                        <button
                            key={q.type}
                            onClick={() => sleepBtn ? toggleSleep(lastSleep) : onQuickLog(q.type)}
                            className="finals-quick"
                            style={{ "--tile": q.color } as React.CSSProperties}
                            data-active={sleepBtn && isSleeping}
                            aria-label={sleepBtn ? (isSleeping ? "Woke up — end sleep" : "Start sleep now") : `Log ${q.label}`}
                        >
                            <span className="material-symbols-outlined text-[26px]">{sleepBtn && isSleeping ? "wb_sunny" : q.icon}</span>
                            <span>{label}</span>
                        </button>
                    )
                })}
            </div>

            {running && running.length > 0 && (
                <ul className="mt-4 space-y-2">
                    {running.map(a => (
                        <li key={a.id} className="flex items-center gap-3 p-3 finals-inset">
                            <span className="material-symbols-outlined text-[var(--finals-cyan)]">{getSubtype(a)?.icon ?? "toys"}</span>
                            <span className="flex-1 font-bold uppercase tracking-wide text-sm">
                                {getSubtype(a)?.label ?? "Activity"} · <span className="tabular-nums">{formatMinutes((now - a.startTime) / 60000)}</span>
                                {now - a.startTime > 3 * 3600_000 && <span className="block text-[11px] normal-case tracking-normal text-[var(--finals-yellow)]">Still going? Tap Done</span>}
                            </span>
                            <button onClick={() => stop(a.id)} className="finals-chip" data-active="true" style={{ "--tile": "var(--finals-cyan)" } as React.CSSProperties}>
                                Done
                            </button>
                        </li>
                    ))}
                </ul>
            )}

        </section>
    )
}

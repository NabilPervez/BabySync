"use client"

import { useMemo, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { format, isToday, startOfDay } from "date-fns"
import { db, type Log } from "@/lib/db"
import { BottomNav } from "@/components/BottomNav"
import { useNow } from "@/components/LiveStateCard"
import { ActivityBreakdown } from "@/components/trends/ActivityBreakdown"
import { formatMinutes } from "@/lib/log-types"
import {
    average, dayMap, dayStats, daysWithData, fmtClock, lastNDays, predictNext, rhythm,
    type DayStats, type Block, type Tick,
} from "@/lib/analytics"

const COLORS = {
    night: "var(--finals-pink)", nap: "color-mix(in srgb, var(--finals-pink) 55%, transparent)",
    play: "var(--finals-cyan)", screen: "color-mix(in srgb, var(--finals-cyan) 45%, transparent)",
    meal: "var(--finals-yellow)", potty: "var(--finals-white)", accident: "var(--finals-red)", meds: "var(--finals-red)",
}

export default function AnalyticsPage() {
    const [period, setPeriod] = useState<7 | 14>(7)
    const now = useNow(60_000)
    const since = startOfDay(now).getTime() - 15 * 86400_000
    const logs = useLiveQuery(() => db.logs.where("startTime").above(since).toArray(), [since])

    return (
        <div className="finals-page">
            <header className="finals-header">
                <h1 className="finals-heading text-3xl">Analytics</h1>
                <div className="flex gap-1" role="group" aria-label="Period">
                    {([7, 14] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className="finals-chip text-xs" data-active={period === p} aria-pressed={period === p}>
                            {p} days
                        </button>
                    ))}
                </div>
            </header>
            <main className="finals-main flex flex-col gap-5">
                {!logs ? <p className="text-[var(--finals-muted)]">Loading…</p>
                    : logs.length === 0 ? <EmptyState />
                    : <Analytics logs={logs} period={period} now={now} />}
            </main>
            <BottomNav />
        </div>
    )
}

function EmptyState() {
    return (
        <div className="finals-card p-6 text-center">
            <span className="material-symbols-outlined text-5xl text-[var(--finals-muted)]">insights</span>
            <p className="mt-2 font-bold">No data yet</p>
            <p className="text-sm text-[var(--finals-muted)]">Log sleeps, meals and play for a couple of days and patterns show up here.</p>
        </div>
    )
}

function Analytics({ logs, period, now }: { logs: Log[], period: number, now: number }) {
    const data = useMemo(() => {
        const days = lastNDays(period, now)
        const today = days[days.length - 1]
        const past = daysWithData(logs, days.slice(0, -1))
        const cutoff = now - today
        const rh = rhythm(logs, days[0] - 86400_000)
        return {
            days,
            stats: days.map(d => dayStats(logs, d, now)),
            today: dayStats(logs, today, now),
            // "usual by now": past days counted only up to the current clock time
            usualByNow: past.map(d => dayStats(logs, d, now, cutoff)),
            pastFull: past.map(d => dayStats(logs, d, now)),
            rhythm: rh,
            next: predictNext(logs, rh, now),
            maps: days.map(d => ({ day: d, ...dayMap(logs, d, now) })),
        }
    }, [logs, period, now])

    return (
        <>
            <TodaySoFar today={data.today} usual={data.usualByNow} now={now} next={data.next} />
            <RhythmCard r={data.rhythm} />
            <DayMapCard maps={data.maps} now={now} />
            <SleepBars stats={data.stats} pastFull={data.pastFull} />
            <CountBars stats={data.stats} />
            <ActivityBreakdown data={logs} days={period} />
        </>
    )
}

// ---------- Today so far ----------

function TodaySoFar({ today, usual, now, next }: { today: DayStats, usual: DayStats[], now: number, next: ReturnType<typeof predictNext> }) {
    const rows: { label: string, key: keyof DayStats, fmt: (n: number) => string, color: string, lowIsBad?: boolean }[] = [
        { label: "Sleep", key: "sleepMin", fmt: formatMinutes, color: COLORS.night, lowIsBad: true },
        { label: "Naps", key: "naps", fmt: n => n.toFixed(n % 1 ? 1 : 0), color: COLORS.night },
        { label: "Meals & snacks", key: "meals", fmt: n => n.toFixed(n % 1 ? 1 : 0), color: COLORS.meal, lowIsBad: true },
        { label: "Potty / diapers", key: "potty", fmt: n => n.toFixed(n % 1 ? 1 : 0), color: COLORS.potty },
        { label: "Play", key: "playMin", fmt: formatMinutes, color: COLORS.play, lowIsBad: true },
        { label: "Screen time", key: "screenMin", fmt: formatMinutes, color: COLORS.screen },
    ]
    const hasHistory = usual.length > 0

    return (
        <section className="finals-card finals-card-accent p-5" style={{ "--tile": "var(--finals-red)" } as React.CSSProperties}>
            <h2 className="finals-heading text-xl">Today so far</h2>
            <p className="text-xs text-[var(--finals-muted)] mt-1">
                {hasHistory ? `Compared with a usual day by ${format(now, "h:mm a")} (avg of ${usual.length} day${usual.length > 1 ? "s" : ""})` : "Log a few more days to see comparisons"}
            </p>

            {next && (
                <div className="finals-inset mt-4 p-3 flex items-center gap-3" style={{ borderLeft: "4px solid var(--finals-pink)" }}>
                    <span className="material-symbols-outlined text-[var(--finals-pink)]">{next.kind === "wake" ? "wb_sunny" : "bedtime"}</span>
                    <span className="flex-1 text-sm">
                        <b>{next.kind === "nap" ? "Next nap" : next.kind === "bedtime" ? "Bedtime" : "Likely to wake"}</b> around{" "}
                        <b>{format(next.at, "h:mm a")}</b>
                        <span className="text-[var(--finals-muted)]"> · {next.at > now ? `in ${formatMinutes((next.at - now) / 60000)}` : `${formatMinutes((now - next.at) / 60000)} overdue`}</span>
                        <span className="block text-xs text-[var(--finals-muted)]">Based on {next.basis}</span>
                    </span>
                </div>
            )}

            <ul className="mt-4 divide-y divide-[var(--finals-line)]">
                {rows.map(r => {
                    const t = today[r.key] as number
                    const u = average(usual, r.key)
                    const diff = t - u
                    const big = hasHistory && Math.abs(diff) >= Math.max(1, u * 0.25)
                    const arrow = !big ? "" : diff > 0 ? "▲" : "▼"
                    const warn = big && r.lowIsBad && diff < 0
                    return (
                        <li key={r.key} className="flex items-center gap-3 py-2.5">
                            <span className="w-2 h-6" style={{ background: r.color }} />
                            <span className="flex-1 text-sm font-semibold">{r.label}</span>
                            <span className="finals-heading text-xl tabular-nums">{r.fmt(t)}</span>
                            {hasHistory && (
                                <span className={`w-24 text-right text-xs tabular-nums ${warn ? "text-[var(--finals-yellow)] font-bold" : "text-[var(--finals-muted)]"}`}>
                                    {arrow} usual {r.fmt(u)}
                                </span>
                            )}
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

// ---------- Rhythm ----------

function RhythmCard({ r }: { r: ReturnType<typeof rhythm> }) {
    const items = [
        { icon: "wb_sunny", label: "Wakes up", value: fmtClock(r.wakeUp) },
        { icon: "airline_seat_flat", label: "First nap", value: fmtClock(r.firstNap) },
        { icon: "timer", label: "Nap length", value: r.napLength ? formatMinutes(r.napLength) : "—" },
        { icon: "bolt", label: "Awake between sleeps", value: r.wakeWindow ? formatMinutes(r.wakeWindow) : "—" },
        { icon: "nights_stay", label: "Bedtime", value: fmtClock(r.bedtime) },
    ]
    return (
        <section className="finals-card p-5">
            <h2 className="finals-heading text-xl">Usual rhythm</h2>
            <p className="text-xs text-[var(--finals-muted)] mt-1">Typical times from the last two weeks of sleep logs</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
                {items.map((it, i) => (
                    <div key={it.label} className={`finals-inset p-3 ${i === items.length - 1 ? "col-span-2" : ""}`}>
                        <span className="finals-label flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-[var(--finals-pink)]">{it.icon}</span>{it.label}
                        </span>
                        <span className="finals-heading text-2xl tabular-nums">{it.value}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

// ---------- Day map ----------

function DayMapCard({ maps, now }: { maps: { day: number, blocks: Block[], ticks: Tick[] }[], now: number }) {
    const nowFrac = (now - startOfDay(now).getTime()) / 86400_000
    return (
        <section className="finals-card p-5">
            <h2 className="finals-heading text-xl">Day by day</h2>
            <p className="text-xs text-[var(--finals-muted)] mt-1">Each row is one day, midnight to midnight</p>
            <div className="mt-4 space-y-1.5">
                <div className="flex text-[10px] text-[var(--finals-muted)] pl-12">
                    {["12a", "6a", "12p", "6p"].map(t => <span key={t} className="flex-1">{t}</span>)}
                </div>
                {[...maps].reverse().map(m => (
                    <div key={m.day} className="flex items-center gap-2">
                        <span className="w-10 text-[11px] font-bold uppercase text-right">{isToday(m.day) ? "Today" : format(m.day, "EEE")}</span>
                        <div className="relative flex-1 h-6 bg-[var(--finals-bg)] border border-[var(--finals-line)]" role="img"
                            aria-label={`${format(m.day, "EEEE")}: ${m.blocks.filter(b => b.kind === "night" || b.kind === "nap").length} sleeps, ${m.ticks.filter(t => t.kind === "meal").length} meals`}>
                            {[0.25, 0.5, 0.75].map(f => <span key={f} className="absolute top-0 bottom-0 w-px bg-[var(--finals-line)]" style={{ left: `${f * 100}%` }} />)}
                            {m.blocks.map((b, i) => (
                                <span key={i} className="absolute" style={{
                                    left: `${b.from * 100}%`, width: `${Math.max(0.4, (b.to - b.from) * 100)}%`, background: COLORS[b.kind],
                                    top: b.kind === "night" || b.kind === "nap" ? 2 : 13, bottom: b.kind === "night" || b.kind === "nap" ? 13 : 2,
                                }} />
                            ))}
                            {m.ticks.map((t, i) => (
                                <span key={`t${i}`} className="absolute top-0 bottom-0 w-[3px]" style={{ left: `calc(${t.at * 100}% - 1px)`, background: COLORS[t.kind] }} />
                            ))}
                            {isToday(m.day) && <span className="absolute -top-1 -bottom-1 w-0.5 bg-[var(--finals-red)]" style={{ left: `${nowFrac * 100}%` }} />}
                        </div>
                    </div>
                ))}
            </div>
            <Legend items={[["Night sleep", COLORS.night], ["Nap", COLORS.nap], ["Play", COLORS.play], ["Screen", COLORS.screen], ["Meal", COLORS.meal], ["Potty", COLORS.potty], ["Accident / meds", COLORS.accident]]} />
        </section>
    )
}

function Legend({ items }: { items: [string, string][] }) {
    return (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
            {items.map(([label, color]) => (
                <span key={label} className="flex items-center gap-1 text-[11px] text-[var(--finals-muted)]">
                    <span className="w-2.5 h-2.5" style={{ background: color }} />{label}
                </span>
            ))}
        </div>
    )
}

// ---------- Sleep per day ----------

function SleepBars({ stats, pastFull }: { stats: DayStats[], pastFull: DayStats[] }) {
    const max = Math.max(60, ...stats.map(s => s.nightMin + s.napMin))
    const avgNight = average(pastFull, "nightMin")
    const avgNap = average(pastFull, "napMin")
    return (
        <section className="finals-card p-5">
            <h2 className="finals-heading text-xl">Sleep per day</h2>
            <p className="text-xs text-[var(--finals-muted)] mt-1">
                Night counts toward the morning it ended. Usual: {formatMinutes(avgNight)} night + {formatMinutes(avgNap)} naps
            </p>
            <div className="flex items-end gap-1.5 h-40 mt-4">
                {stats.map(s => (
                    <div key={s.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${format(s.day, "EEE")}: ${formatMinutes(s.nightMin)} night, ${formatMinutes(s.napMin)} naps`}>
                        <span className="text-[10px] tabular-nums text-[var(--finals-muted)]">{s.nightMin + s.napMin ? Math.round((s.nightMin + s.napMin) / 6) / 10 : ""}</span>
                        <div className="w-full flex flex-col justify-end" style={{ height: `${((s.nightMin + s.napMin) / max) * 100}%` }}>
                            <div style={{ height: `${(s.napMin / Math.max(1, s.nightMin + s.napMin)) * 100}%`, background: COLORS.nap }} />
                            <div className="flex-1" style={{ background: COLORS.night }} />
                        </div>
                        <span className="text-[10px] font-bold uppercase">{isToday(s.day) ? "Tdy" : format(s.day, "EEEEE")}</span>
                    </div>
                ))}
            </div>
            <Legend items={[["Night (hours)", COLORS.night], ["Naps", COLORS.nap]]} />
        </section>
    )
}

// ---------- Meals & potty ----------

function CountBars({ stats }: { stats: DayStats[] }) {
    const pottyTotal = stats.reduce((s, d) => s + d.pottySuccess + d.accidents, 0)
    const success = stats.reduce((s, d) => s + d.pottySuccess, 0)
    const series: { label: string, key: keyof DayStats, color: string }[] = [
        { label: "Meals & snacks", key: "meals", color: COLORS.meal },
        { label: "Potty / diapers", key: "potty", color: COLORS.potty },
    ]
    return (
        <section className="finals-card p-5 space-y-5">
            {series.map(se => {
                const max = Math.max(1, ...stats.map(s => s[se.key] as number))
                return (
                    <div key={se.key}>
                        <div className="flex justify-between items-baseline">
                            <h2 className="finals-heading text-lg">{se.label}</h2>
                            <span className="text-xs text-[var(--finals-muted)]">avg {(average(stats.slice(0, -1), se.key)).toFixed(1)}/day</span>
                        </div>
                        <div className="flex items-end gap-1.5 h-20 mt-2">
                            {stats.map(s => (
                                <div key={s.day} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                                    <span className="text-[10px] tabular-nums">{(s[se.key] as number) || ""}</span>
                                    <div className="w-full" style={{ height: `${((s[se.key] as number) / max) * 70}%`, background: se.color }} />
                                    <span className="text-[10px] font-bold uppercase text-[var(--finals-muted)]">{isToday(s.day) ? "Tdy" : format(s.day, "EEEEE")}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
            {pottyTotal > 0 && (
                <div className="finals-inset p-3">
                    <span className="finals-label">Potty training</span>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="finals-heading text-3xl" style={{ color: "var(--finals-cyan)" }}>{Math.round((success / pottyTotal) * 100)}%</span>
                        <span className="text-sm text-[var(--finals-muted)]">{success} on the potty, {pottyTotal - success} accident{pottyTotal - success === 1 ? "" : "s"}</span>
                    </div>
                    <div className="h-2 mt-2 bg-[var(--finals-red)]"><div className="h-full bg-[var(--finals-cyan)]" style={{ width: `${(success / pottyTotal) * 100}%` }} /></div>
                </div>
            )}
        </section>
    )
}

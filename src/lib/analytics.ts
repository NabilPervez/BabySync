/** Pure calculations behind the Analytics tab. All times are epoch ms, local time zone. */
import { addDays, startOfDay } from "date-fns"
import type { Log } from "@/lib/db"

const MIN = 60_000
const HOUR = 60 * MIN

export interface DayStats {
    day: number            // start of day
    sleepMin: number       // all sleep overlapping this calendar day
    nightMin: number       // night sleep that ended this morning ("last night")
    napMin: number
    naps: number
    meals: number
    potty: number          // all diaper/potty events
    pottySuccess: number   // used the potty
    accidents: number
    playMin: number
    screenMin: number
    meds: number
}

const overlap = (s: number, e: number, a: number, b: number) => Math.max(0, Math.min(e, b) - Math.max(s, a))

/**
 * Stats for one day, optionally only counting things up to `cutoff`
 * (so today at 3pm can be compared with other days at 3pm).
 */
export function dayStats(logs: Log[], day: number, now: number, cutoffMs?: number): DayStats {
    const dayEnd = addDays(day, 1).getTime()
    const limit = Math.min(dayEnd, cutoffMs !== undefined ? day + cutoffMs : dayEnd, now)
    const st: DayStats = { day, sleepMin: 0, nightMin: 0, napMin: 0, naps: 0, meals: 0, potty: 0, pottySuccess: 0, accidents: 0, playMin: 0, screenMin: 0, meds: 0 }

    for (const l of logs) {
        const end = l.endTime ?? (l.type === "SLEEP" || l.type === "ACTIVITY" ? now : l.startTime)
        const inDay = l.startTime >= day && l.startTime < limit
        switch (l.type) {
            case "SLEEP": {
                st.sleepMin += overlap(l.startTime, end, day, limit) / MIN
                if (l.subtype === "night") {
                    // "last night" = the night sleep that ended this morning
                    if (end > day && end <= limit && l.startTime < day + 12 * HOUR) st.nightMin += (end - l.startTime) / MIN
                } else if (inDay) {
                    st.naps++
                    st.napMin += (Math.min(end, limit) - l.startTime) / MIN
                }
                break
            }
            case "FEED":
                if (inDay && l.subtype !== "water") st.meals++
                break
            case "DIAPER":
                if (!inDay) break
                st.potty++
                if (l.subtype?.startsWith("potty_")) st.pottySuccess++
                if (l.subtype === "accident") st.accidents++
                break
            case "ACTIVITY": {
                const m = overlap(l.startTime, end, day, limit) / MIN
                st.playMin += m
                if (l.subtype === "screen") st.screenMin += m
                break
            }
            case "MEDICINE":
                if (inDay) st.meds++
                break
        }
    }
    return st
}

export function lastNDays(n: number, now: number) {
    const today = startOfDay(now).getTime()
    return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1).getTime())
}

export function average(days: DayStats[], key: keyof DayStats) {
    if (days.length === 0) return 0
    return days.reduce((s, d) => s + (d[key] as number), 0) / days.length
}

/** Days that have at least one entry; empty days would drag averages to zero. */
export function daysWithData(logs: Log[], days: number[]) {
    const has = new Set(logs.map(l => startOfDay(l.startTime).getTime()))
    return days.filter(d => has.has(d))
}

function median(xs: number[]) {
    if (xs.length === 0) return undefined
    const s = [...xs].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Minutes after midnight; times before noon count as "late" for bedtimes (e.g. 00:30 -> 24:30). */
const clockMin = (t: number, lateWrap = false) => {
    const d = new Date(t)
    const m = d.getHours() * 60 + d.getMinutes()
    return lateWrap && m < 12 * 60 ? m + 24 * 60 : m
}

export interface Rhythm {
    wakeUp?: number      // minutes after midnight
    firstNap?: number
    bedtime?: number
    wakeWindow?: number  // typical minutes awake between sleeps
    napLength?: number
}

/** Typical daily rhythm from the last couple of weeks of sleep logs. */
export function rhythm(logs: Log[], since: number): Rhythm {
    const sleeps = logs.filter(l => l.type === "SLEEP" && l.endTime && l.startTime >= since).sort((a, b) => a.startTime - b.startTime)
    // Only plausible nights (starting 5pm–3am) so a mislabelled afternoon sleep can't skew bedtime
    const nights = sleeps.filter(s => s.subtype === "night" && clockMin(s.startTime, true) >= 17 * 60 && clockMin(s.startTime, true) <= 27 * 60)
    const naps = sleeps.filter(s => s.subtype !== "night")

    const firstNapByDay = new Map<number, number>()
    for (const n of naps) {
        const d = startOfDay(n.startTime).getTime()
        if (!firstNapByDay.has(d)) firstNapByDay.set(d, n.startTime)
    }

    const windows: number[] = []
    for (let i = 1; i < sleeps.length; i++) {
        const gap = (sleeps[i].startTime - sleeps[i - 1].endTime!) / MIN
        if (gap > 20 && gap < 8 * 60) windows.push(gap) // ignore split naps and missed logs
    }

    return {
        wakeUp: median(nights.map(n => clockMin(n.endTime!))),
        bedtime: median(nights.map(n => clockMin(n.startTime, true))),
        firstNap: median([...firstNapByDay.values()].map(t => clockMin(t))),
        wakeWindow: median(windows),
        napLength: median(naps.map(n => (n.endTime! - n.startTime) / MIN)),
    }
}

export interface Prediction {
    kind: "nap" | "bedtime" | "wake"
    at: number
    basis: string
}

/** What's likely next, from the typical rhythm and what happened today. */
export function predictNext(logs: Log[], r: Rhythm, now: number): Prediction | undefined {
    const sleeps = logs.filter(l => l.type === "SLEEP").sort((a, b) => a.startTime - b.startTime)
    const last = sleeps[sleeps.length - 1]
    const today = startOfDay(now).getTime()

    if (last && !last.endTime) {
        const len = last.subtype === "night" ? undefined : r.napLength
        if (len) return { kind: "wake", at: last.startTime + len * MIN, basis: "typical nap length" }
        if (last.subtype === "night" && r.wakeUp !== undefined) {
            let at = today + r.wakeUp * MIN
            if (at < last.startTime) at = addDays(at, 1).getTime()
            return { kind: "wake", at, basis: "usual wake-up" }
        }
        return undefined
    }

    let bedtimeAt = r.bedtime !== undefined ? today + r.bedtime * MIN : undefined
    // Way past usual bedtime (e.g. the night wasn't logged) — don't nag about it
    if (bedtimeAt && now - bedtimeAt > 3 * HOUR) bedtimeAt = undefined
    if (last?.endTime && r.wakeWindow) {
        const napAt = last.endTime + r.wakeWindow * MIN
        // If the next nap would land within ~1.5h of bedtime, the next sleep is bedtime
        if (bedtimeAt && napAt > bedtimeAt - 90 * MIN) return { kind: "bedtime", at: bedtimeAt, basis: "usual bedtime" }
        // Way overdue usually means a nap just wasn't logged; fall back to bedtime
        if (now - napAt < 3 * HOUR) return { kind: "nap", at: napAt, basis: `awake ~${Math.round(r.wakeWindow)} min between sleeps` }
    }
    if (bedtimeAt) return { kind: "bedtime", at: bedtimeAt, basis: "usual bedtime" }
    return undefined
}

export function fmtClock(min?: number) {
    if (min === undefined) return "—"
    const m = Math.round(min) % (24 * 60)
    const h = Math.floor(m / 60)
    const mm = String(m % 60).padStart(2, "0")
    return `${h % 12 || 12}:${mm} ${h < 12 ? "AM" : "PM"}`
}

/** Blocks for the day-map chart, clipped to the day, as fractions 0..1 of 24h. */
export interface Block { from: number, to: number, kind: "night" | "nap" | "play" | "screen" }
export interface Tick { at: number, kind: "meal" | "potty" | "accident" | "meds" }

export function dayMap(logs: Log[], day: number, now: number): { blocks: Block[], ticks: Tick[] } {
    const dayEnd = addDays(day, 1).getTime()
    const span = dayEnd - day
    const blocks: Block[] = []
    const ticks: Tick[] = []
    for (const l of logs) {
        if (l.type === "SLEEP" || l.type === "ACTIVITY") {
            const end = l.endTime ?? Math.min(now, l.startTime + 4 * HOUR)
            const a = Math.max(l.startTime, day), b = Math.min(end, dayEnd)
            if (b <= a) continue
            const kind = l.type === "SLEEP" ? (l.subtype === "night" ? "night" : "nap") : (l.subtype === "screen" ? "screen" : "play")
            blocks.push({ from: (a - day) / span, to: (b - day) / span, kind })
        } else if (l.startTime >= day && l.startTime < dayEnd) {
            const kind = l.type === "FEED" ? "meal" : l.type === "DIAPER" ? (l.subtype === "accident" ? "accident" : "potty") : l.type === "MEDICINE" ? "meds" : undefined
            if (kind) ticks.push({ at: (l.startTime - day) / span, kind })
        }
    }
    return { blocks, ticks }
}

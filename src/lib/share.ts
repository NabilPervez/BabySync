import { format, startOfDay } from "date-fns"
import type { Log } from "@/lib/db"
import { CATEGORIES, formatMinutes, logSummary, logTitle } from "@/lib/log-types"

/** A short message describing a single entry. */
export function singleUpdate(log: Log, babyName?: string): string {
    const who = babyName || "Baby"
    const summary = logSummary(log)
    return `${who} update · ${format(log.startTime, "h:mm a")}\n${logTitle(log)}${summary ? ` — ${summary}` : ""}`
}

/** A summary of everything logged today, grouped by category. */
export function dailyUpdate(logs: Log[], babyName?: string, now = Date.now()): string {
    const who = babyName || "Baby"
    const today = logs
        .filter(l => l.startTime >= startOfDay(now).getTime() && l.startTime <= now)
        .sort((a, b) => a.startTime - b.startTime)

    const lines = [`${who}'s day so far (${format(now, "EEE MMM d, h:mm a")})`]

    const sleeping = logs.find(l => l.type === "SLEEP" && !l.endTime)
    if (sleeping) lines.push(`Sleeping now — since ${format(sleeping.startTime, "h:mm a")}`)

    const sleepMins = today
        .filter(l => l.type === "SLEEP" && l.endTime)
        .reduce((sum, l) => sum + (l.endTime! - l.startTime) / 60000, 0)
    if (sleepMins > 0) lines.push(`Total sleep today: ${formatMinutes(sleepMins)}`)

    for (const cat of CATEGORIES) {
        const entries = today.filter(l => l.type === cat.type)
        if (entries.length === 0) continue
        lines.push("", `${cat.label.toUpperCase()} (${entries.length})`)
        for (const l of entries) {
            const s = logSummary(l)
            lines.push(`• ${format(l.startTime, "h:mm a")} ${logTitle(l)}${s ? ` — ${s}` : ""}`)
        }
    }

    if (today.length === 0 && !sleeping) lines.push("Nothing logged yet today.")
    return lines.join("\n")
}

function digits(phone?: string) {
    return (phone || "").replace(/[^\d]/g, "")
}

export function whatsappUrl(text: string, phone?: string) {
    const p = digits(phone)
    return `https://wa.me/${p}?text=${encodeURIComponent(text)}`
}

/** iOS uses `&body=`, Android `?body=`; `?&body=` works on both. */
export function smsUrl(text: string, phone?: string) {
    return `sms:${digits(phone) ? "+" + digits(phone) : ""}?&body=${encodeURIComponent(text)}`
}

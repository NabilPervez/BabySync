import { format, startOfDay } from "date-fns"
import type { Log } from "@/lib/db"
import { formatMinutes, logSummary, logTitle } from "@/lib/log-types"

export const APP_URL = "https://babysync.netlify.app"

const TYPE_EMOJI: Record<string, string> = {
    FEED: "🍽️", SLEEP: "😴", ACTIVITY: "🧸", DIAPER: "🚽", MEDICINE: "💊", HEALTH: "🩺", MOOD: "💬",
}
const SUB_EMOJI: Record<string, string> = {
    breakfast: "🥣", lunch: "🥪", dinner: "🍝", snack: "🍎", milk: "🥛", water: "💧", bottle: "🍼",
    walk: "🚶", play_outside: "🌳", playground: "🛝", reading: "📚", music: "🎵", art: "🎨",
    playdate: "👫", class: "🏫", screen: "📺", bath: "🛁",
    pee: "💧", poop: "💩", both: "💩", potty_pee: "🚽", potty_poop: "🚽", accident: "⚠️",
    temperature: "🌡️", teeth: "🪥", happy: "😄", tantrum: "😤", cranky: "😣", milestone: "🏆", new_word: "🗣️",
    night: "🌙", nap: "😴",
}

export function emojiFor(log: Pick<Log, "type" | "subtype">) {
    return (log.subtype && SUB_EMOJI[log.subtype]) || TYPE_EMOJI[log.type] || "•"
}

function line(l: Log) {
    // Sleep reads better as a range: "1:00 PM–2:30 PM Nap (1h 30m)"
    if (l.type === "SLEEP") {
        const range = l.endTime ? `${format(l.startTime, "h:mm a")}–${format(l.endTime, "h:mm a")}` : `${format(l.startTime, "h:mm a")}`
        const what = l.endTime ? `${logTitle(l)} (${formatMinutes((l.endTime - l.startTime) / 60000)})` : `${logTitle(l)}`
        return `${emojiFor(l)} ${range}  ${what}`
    }
    const s = logSummary(l)
    return `${emojiFor(l)} ${format(l.startTime, "h:mm a")}  ${logTitle(l)}${s ? ` – ${s}` : ""}`
}

const footer = `\n— sent from BabySync ${APP_URL}`

/** A short message describing a single entry. */
export function singleUpdate(log: Log, babyName?: string): string {
    return `${babyName || "Baby"} update:\n${line(log)}${footer}`
}

/** Today's recap: headline totals, then every entry in time order. */
export function dailyUpdate(logs: Log[], babyName?: string, now = Date.now()): string {
    const who = babyName || "Baby"
    const dayStart = startOfDay(now).getTime()
    const today = logs
        .filter(l => (l.startTime >= dayStart || (l.endTime ?? Infinity) >= dayStart) && l.startTime <= now)
        .sort((a, b) => a.startTime - b.startTime)

    const sleepMins = today
        .filter(l => l.type === "SLEEP")
        .reduce((sum, l) => sum + ((l.endTime ?? now) - Math.max(l.startTime, dayStart)) / 60000, 0)
    const meals = today.filter(l => l.type === "FEED" && l.startTime >= dayStart).length
    const potty = today.filter(l => l.type === "DIAPER" && l.startTime >= dayStart).length
    const playMins = today
        .filter(l => l.type === "ACTIVITY" && l.startTime >= dayStart)
        .reduce((sum, l) => sum + ((l.endTime ?? now) - l.startTime) / 60000, 0)

    const totals = [
        sleepMins > 0 && `😴 ${formatMinutes(sleepMins)} sleep`,
        meals > 0 && `🍽️ ${meals} ${meals === 1 ? "meal" : "meals"}`,
        potty > 0 && `🚽 ${potty} potty`,
        playMins > 0 && `🧸 ${formatMinutes(playMins)} play`,
    ].filter(Boolean)

    const out = [`${who}'s day – ${format(now, "EEE MMM d")}`]
    if (totals.length) out.push(totals.join(" · "))
    const sleeping = today.find(l => l.type === "SLEEP" && !l.endTime)
    if (sleeping) out.push(`➡️ Sleeping now (since ${format(sleeping.startTime, "h:mm a")})`)
    out.push("")
    if (today.length === 0) out.push("Nothing logged yet today.")
    else out.push(...today.map(line))
    return out.join("\n") + "\n" + footer
}

function digits(phone?: string) {
    return (phone || "").replace(/[^\d]/g, "")
}

export function whatsappUrl(text: string, phone?: string) {
    return `https://wa.me/${digits(phone)}?text=${encodeURIComponent(text)}`
}

/** iOS uses `&body=`, Android `?body=`; `?&body=` works on both. */
export function smsUrl(text: string, phone?: string) {
    return `sms:${digits(phone) ? "+" + digits(phone) : ""}?&body=${encodeURIComponent(text)}`
}

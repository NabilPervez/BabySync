import type { Log, LogType } from "@/lib/db"

export interface Subtype {
    value: string
    label: string
    icon: string
}

export interface Category {
    type: LogType
    label: string
    icon: string
    /** CSS colour token used for accents (see globals.css) */
    color: string
    subtypes: Subtype[]
    /** Show a duration field (minutes) */
    timed?: boolean
    /** Show an amount field, with this unit (subtype can override via amountUnit) */
    amountUnit?: string
    notesPlaceholder: string
}

export const CATEGORIES: Category[] = [
    {
        type: "FEED",
        label: "Eat",
        icon: "restaurant",
        color: "var(--finals-yellow)",
        amountUnit: "oz",
        notesPlaceholder: "What did they eat? How much did they finish?",
        subtypes: [
            { value: "breakfast", label: "Breakfast", icon: "egg_alt" },
            { value: "lunch", label: "Lunch", icon: "lunch_dining" },
            { value: "dinner", label: "Dinner", icon: "dinner_dining" },
            { value: "snack", label: "Snack", icon: "cookie" },
            { value: "milk", label: "Milk", icon: "local_drink" },
            { value: "water", label: "Water", icon: "water_full" },
            { value: "bottle", label: "Bottle", icon: "baby_changing_station" },
            { value: "breast", label: "Nursing", icon: "favorite" },
            { value: "puree", label: "Puree", icon: "soup_kitchen" },
        ],
    },
    {
        type: "SLEEP",
        label: "Sleep",
        icon: "bedtime",
        color: "var(--finals-pink)",
        timed: true,
        notesPlaceholder: "Fought it? Woke up happy?",
        subtypes: [
            { value: "nap", label: "Nap", icon: "airline_seat_flat" },
            { value: "night", label: "Night", icon: "nights_stay" },
        ],
    },
    {
        type: "ACTIVITY",
        label: "Play",
        icon: "toys",
        color: "var(--finals-cyan)",
        timed: true,
        notesPlaceholder: "Where did you go? What did they love?",
        subtypes: [
            { value: "play_inside", label: "Playing", icon: "toys" },
            { value: "walk", label: "Walk", icon: "directions_walk" },
            { value: "play_outside", label: "Outside", icon: "park" },
            { value: "playground", label: "Playground", icon: "attractions" },
            { value: "reading", label: "Reading", icon: "menu_book" },
            { value: "music", label: "Music / Dance", icon: "music_note" },
            { value: "art", label: "Art / Crafts", icon: "palette" },
            { value: "playdate", label: "Playdate", icon: "groups" },
            { value: "class", label: "Class", icon: "school" },
            { value: "screen", label: "Screen time", icon: "tv" },
            { value: "bath", label: "Bath", icon: "bathtub" },
        ],
    },
    {
        type: "DIAPER",
        label: "Potty",
        icon: "wc",
        color: "var(--finals-white)",
        notesPlaceholder: "Any accidents? Rash?",
        subtypes: [
            { value: "pee", label: "Wet diaper", icon: "water_drop" },
            { value: "poop", label: "Dirty diaper", icon: "circle" },
            { value: "both", label: "Both", icon: "join" },
            { value: "potty_pee", label: "Potty: pee", icon: "wc" },
            { value: "potty_poop", label: "Potty: poop", icon: "wc" },
            { value: "accident", label: "Accident", icon: "warning" },
        ],
    },
    {
        type: "MEDICINE",
        label: "Meds",
        icon: "medication",
        color: "var(--finals-red)",
        amountUnit: "mL",
        notesPlaceholder: "Reason, symptoms...",
        subtypes: [
            { value: "tylenol", label: "Tylenol", icon: "medication" },
            { value: "motrin", label: "Motrin", icon: "medication" },
            { value: "allergy", label: "Allergy", icon: "medication_liquid" },
            { value: "other", label: "Other", icon: "prescriptions" },
        ],
    },
    {
        type: "HEALTH",
        label: "Health",
        icon: "health_and_safety",
        color: "var(--finals-red)",
        notesPlaceholder: "Details...",
        subtypes: [
            { value: "temperature", label: "Temperature", icon: "thermometer" },
            { value: "teeth", label: "Brushed teeth", icon: "dentistry" },
            { value: "teething", label: "Teething", icon: "sentiment_dissatisfied" },
            { value: "boo_boo", label: "Boo-boo", icon: "healing" },
            { value: "sick", label: "Feeling sick", icon: "sick" },
        ],
    },
    {
        type: "MOOD",
        label: "Mood",
        icon: "mood",
        color: "var(--finals-yellow)",
        notesPlaceholder: "What happened?",
        subtypes: [
            { value: "happy", label: "Happy", icon: "sentiment_very_satisfied" },
            { value: "tantrum", label: "Tantrum", icon: "sentiment_extremely_dissatisfied" },
            { value: "cranky", label: "Cranky", icon: "sentiment_dissatisfied" },
            { value: "milestone", label: "Milestone", icon: "emoji_events" },
            { value: "new_word", label: "New word", icon: "record_voice_over" },
            { value: "note", label: "Note", icon: "edit_note" },
        ],
    },
]

/** Minimum hours between doses, used for the "next dose" countdown. */
export const MED_INTERVAL_HOURS: Record<string, number> = { tylenol: 4, motrin: 6 }

const FEED_DRINKS = new Set(["milk", "water", "bottle", "breast"])

export function getCategory(type: string): Category {
    return CATEGORIES.find(c => c.type === type) ?? CATEGORIES[0]
}

export function getSubtype(log: Pick<Log, "type" | "subtype">): Subtype | undefined {
    return getCategory(log.type).subtypes.find(s => s.value === log.subtype)
}

/** Which unit (if any) the amount field uses for a given type + subtype. */
export function amountUnitFor(type: string, subtype?: string): string | undefined {
    if (type === "FEED") return subtype && FEED_DRINKS.has(subtype) ? "oz" : undefined
    if (type === "HEALTH") return subtype === "temperature" ? "°F" : undefined
    return getCategory(type).amountUnit
}

export function logTitle(log: Log): string {
    const sub = getSubtype(log)
    if (log.type === "SLEEP") {
        const kind = sub?.label ?? "Sleep"
        return log.endTime ? kind : `${kind} (sleeping now)`
    }
    if (log.type === "MEDICINE" && log.details?.name) return String(log.details.name)
    return sub?.label ?? getCategory(log.type).label
}

export function logIcon(log: Log): string {
    return getSubtype(log)?.icon ?? getCategory(log.type).icon
}

export function formatMinutes(mins: number): string {
    const m = Math.max(0, Math.round(mins))
    const h = Math.floor(m / 60)
    if (h === 0) return `${m}m`
    return m % 60 ? `${h}h ${m % 60}m` : `${h}h`
}

export function logDurationMinutes(log: Log): number | undefined {
    if (!log.endTime) return undefined
    return (log.endTime - log.startTime) / 60000
}

/** One-line description used in the timeline and in shared updates. */
export function logSummary(log: Log): string {
    const parts: string[] = []
    const dur = logDurationMinutes(log)
    if (dur !== undefined) parts.push(formatMinutes(dur))
    else if (log.type === "ACTIVITY" && !log.endTime) parts.push("in progress")
    const amount = log.details?.amount
    if (amount !== undefined && amount !== "" && amount !== null) {
        parts.push(`${amount}${log.details?.unit ? " " + log.details.unit : ""}`)
    }
    if (log.details?.notes) parts.push(String(log.details.notes))
    return parts.join(" · ")
}

/** Night sleep if started between 6pm and 6am. */
export function guessSleepSubtype(start = Date.now()): "nap" | "night" {
    const h = new Date(start).getHours()
    return h >= 18 || h < 6 ? "night" : "nap"
}

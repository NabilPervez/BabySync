"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer"
import { db, type Log, type LogType } from "@/lib/db"
import { CATEGORIES, amountUnitFor, getCategory, guessSleepSubtype } from "@/lib/log-types"

interface AddActivityDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** An existing log to edit, or a partial one (e.g. just `type`) to pre-select */
    defaultValues?: Partial<Log> | null
}

export function AddActivityDrawer({ open, onOpenChange, defaultValues }: AddActivityDrawerProps) {
    const isEditing = !!defaultValues?.id
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="finals-drawer">
                <div className="mx-auto w-full max-w-md overflow-y-auto max-h-[85dvh]">
                    <DrawerHeader className="text-left">
                        <DrawerTitle className="finals-heading text-2xl">
                            {isEditing ? "Edit entry" : "Log it"}
                        </DrawerTitle>
                        <DrawerDescription className="sr-only">Record an activity</DrawerDescription>
                    </DrawerHeader>
                    {/* key resets the form every time the drawer opens on a different entry */}
                    {open && (
                        <LogForm
                            key={defaultValues?.id ?? defaultValues?.type ?? "new"}
                            initial={defaultValues ?? undefined}
                            onDone={() => onOpenChange(false)}
                        />
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}

const toLocalInput = (ts: number) => format(ts, "yyyy-MM-dd'T'HH:mm")
const fromLocalInput = (s: string) => new Date(s).getTime()

function LogForm({ initial, onDone }: { initial?: Partial<Log>, onDone: () => void }) {
    const isEditing = !!initial?.id
    const [type, setType] = useState<LogType>(initial?.type ?? "FEED")
    const category = getCategory(type)
    const [subtype, setSubtype] = useState<string>(
        initial?.subtype ?? (type === "SLEEP" ? guessSleepSubtype() : category.subtypes[0].value)
    )
    const [subtypePicked, setSubtypePicked] = useState(!!initial?.subtype)
    const [start, setStart] = useState(() => toLocalInput(initial?.startTime ?? Date.now()))
    const [duration, setDuration] = useState(
        initial?.endTime && initial.startTime ? String(Math.round((initial.endTime - initial.startTime) / 60000)) : ""
    )
    // Sleep uses a start + end time instead of minutes; blank end = still asleep
    const [end, setEnd] = useState(() => initial?.endTime ? toLocalInput(initial.endTime) : "")
    const [amount, setAmount] = useState(initial?.details?.amount != null ? String(initial.details.amount) : "")
    const [notes, setNotes] = useState(String(initial?.details?.notes ?? ""))
    const [error, setError] = useState("")

    const unit = amountUnitFor(type, subtype)
    const isSleep = type === "SLEEP"

    const pickType = (t: LogType) => {
        setType(t)
        setSubtypePicked(false)
        setSubtype(t === "SLEEP" ? guessSleepSubtype() : getCategory(t).subtypes[0].value)
    }

    const save = async () => {
        const startTime = fromLocalInput(start)
        if (Number.isNaN(startTime)) return setError("Pick a valid time")
        if (startTime > Date.now() + 60_000) return setError("That time is in the future")
        const mins = duration === "" ? undefined : Number(duration)
        if (mins !== undefined && (Number.isNaN(mins) || mins < 0)) return setError("Duration must be a positive number")
        let endTime: number | undefined
        if (isSleep) {
            if (end) {
                endTime = fromLocalInput(end)
                if (Number.isNaN(endTime)) return setError("Pick a valid wake-up time")
                if (endTime <= startTime) return setError("Woke up must be after fell asleep")
                if (endTime > Date.now() + 60_000) return setError("Wake-up time is in the future")
            }
        } else if (mins !== undefined && category.timed) {
            endTime = startTime + mins * 60000
        }
        const amt = amount === "" ? undefined : Number(amount)
        if (amt !== undefined && Number.isNaN(amt)) return setError("Amount must be a number")

        const log: Omit<Log, "id"> = {
            type,
            // Nap vs night follows the time they fell asleep unless chosen explicitly
            subtype: isSleep && !subtypePicked ? guessSleepSubtype(startTime) : subtype,
            startTime,
            endTime,
            details: {
                ...(amt !== undefined && unit ? { amount: amt, unit } : {}),
                ...(notes.trim() ? { notes: notes.trim() } : {}),
            },
            createdAt: initial?.createdAt ?? Date.now(),
        }
        try {
            if (isEditing) await db.logs.put({ ...log, id: initial!.id! })
            else await db.logs.add(log)
            onDone()
        } catch (e) {
            console.error("Failed to save log:", e)
            setError("Couldn't save — try again")
        }
    }

    const remove = async () => {
        if (!initial?.id) return
        if (!confirm("Delete this entry?")) return
        await db.logs.delete(initial.id)
        onDone()
    }

    return (
        <div className="px-4 pb-6 space-y-5">
            {!isEditing && (
                <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Category">
                    {CATEGORIES.map(c => (
                        <button
                            key={c.type}
                            type="button"
                            role="radio"
                            aria-checked={type === c.type}
                            onClick={() => pickType(c.type)}
                            className="finals-tile flex flex-col items-center gap-1 py-3"
                            data-active={type === c.type}
                            style={{ "--tile": c.color } as React.CSSProperties}
                        >
                            <span className="material-symbols-outlined text-[26px]">{c.icon}</span>
                            <span className="text-xs font-bold uppercase tracking-wider">{c.label}</span>
                        </button>
                    ))}
                </div>
            )}

            <fieldset>
                <legend className="finals-label mb-2">{category.label}: what kind?</legend>
                <div className="flex flex-wrap gap-2">
                    {category.subtypes.map(s => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => { setSubtype(s.value); setSubtypePicked(true) }}
                            className="finals-chip"
                            data-active={subtype === s.value}
                            style={{ "--tile": category.color } as React.CSSProperties}
                        >
                            <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                            {s.label}
                        </button>
                    ))}
                </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
                <label className="block col-span-2">
                    <span className="finals-label">{isSleep ? "Fell asleep" : category.timed ? "Started" : "When"}</span>
                    <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="finals-input" />
                </label>
                {isSleep && (
                    <label className="block col-span-2">
                        <span className="finals-label">Woke up <span className="normal-case tracking-normal">(leave blank if still asleep)</span></span>
                        <div className="flex gap-2">
                            <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="finals-input" />
                            <button type="button" onClick={() => setEnd(toLocalInput(Date.now()))} className="finals-btn finals-btn-ghost mt-[0.35rem] text-sm">Now</button>
                        </div>
                    </label>
                )}
                {category.timed && !isSleep && (
                    <label className="block">
                        <span className="finals-label">How long (min)</span>
                        <input type="number" inputMode="numeric" min={0} value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" className="finals-input" />
                    </label>
                )}
                {unit && (
                    <label className="block">
                        <span className="finals-label">Amount ({unit})</span>
                        <input type="number" inputMode="decimal" step="0.1" value={amount} onChange={e => setAmount(e.target.value)} placeholder={unit === "°F" ? "98.6" : "4"} className="finals-input" />
                    </label>
                )}
            </div>
            {category.timed && !isSleep && (
                <div className="flex flex-wrap gap-2 -mt-2">
                    {[15, 30, 45, 60, 90, 120].map(m => (
                        <button key={m} type="button" className="finals-chip text-xs" data-active={duration === String(m)} onClick={() => setDuration(String(m))}>
                            {m < 60 ? `${m}m` : `${m / 60}h`}
                        </button>
                    ))}
                </div>
            )}

            <label className="block">
                <span className="finals-label">Notes</span>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={category.notesPlaceholder} rows={2} className="finals-input resize-none" />
            </label>

            {error && <p role="alert" className="text-sm font-semibold text-[var(--finals-red)]">{error}</p>}

            <div className="flex gap-3">
                {isEditing && (
                    <button type="button" onClick={remove} className="finals-btn finals-btn-ghost" aria-label="Delete entry">
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                )}
                <button type="button" onClick={onDone} className="finals-btn finals-btn-ghost flex-1">Cancel</button>
                <button type="button" onClick={save} className="finals-btn finals-btn-primary flex-[2]">
                    {isEditing ? "Save changes" : `Save ${category.label}`}
                </button>
            </div>
        </div>
    )
}

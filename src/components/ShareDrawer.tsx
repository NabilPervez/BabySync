"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { db, type Log } from "@/lib/db"
import { dailyUpdate, singleUpdate, smsUrl, whatsappUrl } from "@/lib/share"

/** Share today's summary, or one entry if `log` is given, by WhatsApp / SMS. */
export function ShareDrawer({ open, onOpenChange, log }: { open: boolean, onOpenChange: (o: boolean) => void, log?: Log | null }) {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="finals-drawer">
                <div className="mx-auto w-full max-w-md">
                    <DrawerHeader className="text-left">
                        <DrawerTitle className="finals-heading text-2xl">{log ? "Send update" : "Send today's recap"}</DrawerTitle>
                        <DrawerDescription className="text-[var(--finals-muted)]">Edit the message if you like, then pick how to send it.</DrawerDescription>
                    </DrawerHeader>
                    {open && <ShareBody key={log?.id ?? "day"} log={log} onDone={() => onOpenChange(false)} />}
                </div>
            </DrawerContent>
        </Drawer>
    )
}

function ShareBody({ log, onDone }: { log?: Log | null, onDone: () => void }) {
    const data = useLiveQuery(async () => ({
        baby: await db.babies.limit(1).first(),
        logs: log ? [] : await db.logs.where("startTime").above(Date.now() - 36 * 3600_000).toArray(),
    }))
    if (!data) return <p className="p-4 text-[var(--finals-muted)]">Loading…</p>
    const initial = log ? singleUpdate(log, data.baby?.name) : dailyUpdate(data.logs, data.baby?.name)
    return <ShareForm initial={initial} phone={data.baby?.sharePhone} onDone={onDone} />
}

function ShareForm({ initial, phone, onDone }: { initial: string, phone?: string, onDone: () => void }) {
    const [text, setText] = useState(initial)
    const [copied, setCopied] = useState(false)
    const canNativeShare = typeof navigator !== "undefined" && !!navigator.share

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch { /* clipboard blocked; the text is still selectable */ }
    }

    return (
        <div className="px-4 pb-6 space-y-4">
            <textarea value={text} onChange={e => setText(e.target.value)} rows={8} className="finals-input font-mono text-xs leading-relaxed" aria-label="Message" />
            {!phone && (
                <p className="text-xs text-[var(--finals-muted)]">
                    Tip: save a phone number in Settings so messages go straight to the right person.
                </p>
            )}
            <div className="grid grid-cols-2 gap-3">
                <a href={whatsappUrl(text, phone)} target="_blank" rel="noopener noreferrer" onClick={onDone} className="finals-btn finals-btn-primary" style={{ background: "#25D366", color: "#08130c" }}>
                    <span className="material-symbols-outlined">chat</span> WhatsApp
                </a>
                <a href={smsUrl(text, phone)} onClick={onDone} className="finals-btn finals-btn-primary">
                    <span className="material-symbols-outlined">sms</span> Text (SMS)
                </a>
                <button onClick={copy} className="finals-btn finals-btn-ghost">
                    <span className="material-symbols-outlined">{copied ? "check" : "content_copy"}</span> {copied ? "Copied" : "Copy"}
                </button>
                {canNativeShare ? (
                    <button onClick={() => navigator.share({ text }).then(onDone).catch(() => {})} className="finals-btn finals-btn-ghost">
                        <span className="material-symbols-outlined">ios_share</span> More…
                    </button>
                ) : (
                    <button onClick={onDone} className="finals-btn finals-btn-ghost">Close</button>
                )}
            </div>
        </div>
    )
}

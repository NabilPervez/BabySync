"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import { CODE_RE, newCode, normalizeCode } from "@/lib/sync-protocol"
import { getSyncCode, joinFamily, leaveFamily, startSyncLoop, syncNow, syncStatusStore } from "@/lib/sync"
import { APP_URL } from "@/lib/share"

export function useSyncStatus() {
    return useSyncExternalStore(syncStatusStore.subscribe, syncStatusStore.get, syncStatusStore.getServer)
}

/** Mounted once in the layout: runs the sync loop and handles invite links (#join=CODE). */
export function SyncBoot() {
    useEffect(() => {
        const stop = startSyncLoop()
        const m = location.hash.match(/join=([A-Za-z0-9-]+)/)
        if (m) {
            const code = normalizeCode(m[1])
            history.replaceState(null, "", location.pathname)
            if (CODE_RE.test(code) && code !== getSyncCode()
                && confirm("Join this family? Entries on this phone will be merged with theirs and kept in sync.")) {
                joinFamily(code)
            }
        }
        return stop
    }, [])
    return null
}

/** Small cloud icon for headers. */
export function SyncBadge() {
    const s = useSyncStatus()
    if (s.kind === "off") return null
    const icon = s.kind === "syncing" ? "sync" : s.kind === "ok" ? "cloud_done" : "cloud_off"
    const label = s.kind === "ok" ? "Synced" : s.kind === "syncing" ? "Syncing…" : s.message
    return (
        <span title={label} aria-label={label} className={`material-symbols-outlined text-[20px] ${s.kind === "error" ? "text-[var(--finals-yellow)]" : "text-[var(--finals-muted)]"} ${s.kind === "syncing" ? "animate-spin" : ""}`}>
            {icon}
        </span>
    )
}

export function FamilySync() {
    const status = useSyncStatus()
    // Rendered only inside the (client-only) settings drawer, so localStorage is available
    const [code, setCode] = useState<string | null>(() => getSyncCode())
    const [input, setInput] = useState("")
    const [error, setError] = useState("")

    const create = async () => {
        const c = newCode()
        await joinFamily(c)
        setCode(c)
    }
    const join = async () => {
        const c = normalizeCode(input)
        if (!CODE_RE.test(c)) return setError("That code doesn't look right — it's 4 groups of 5 letters/numbers")
        setError("")
        await joinFamily(c)
        setCode(c)
    }
    const leave = () => {
        if (!confirm("Stop syncing this phone? Entries already here stay here.")) return
        leaveFamily()
        setCode(null)
    }

    const invite = code ? `Join me on BabySync so we both see the same log: ${APP_URL}/#join=${code}` : ""

    return (
        <section className="pt-4 border-t border-[var(--finals-line)] space-y-3">
            <h3 className="finals-heading text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--finals-cyan)]">devices</span> Family sync
            </h3>
            {code ? (
                <>
                    <p className="text-sm">
                        {status.kind === "ok" && <>Synced {formatDistanceToNowStrict(status.at)} ago. </>}
                        {status.kind === "syncing" && "Syncing… "}
                        {status.kind === "error" && <span className="text-[var(--finals-yellow)]">{status.message}. </span>}
                        Both phones see the same entries.
                    </p>
                    <div className="finals-inset p-3">
                        <span className="finals-label">Family code (keep it private)</span>
                        <span className="block font-mono text-lg tracking-wider select-all">{code}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <a href={`https://wa.me/?text=${encodeURIComponent(invite)}`} target="_blank" rel="noopener noreferrer" className="finals-btn finals-btn-ghost text-sm">
                            <span className="material-symbols-outlined">chat</span> Invite (WhatsApp)
                        </a>
                        <a href={`sms:?&body=${encodeURIComponent(invite)}`} className="finals-btn finals-btn-ghost text-sm">
                            <span className="material-symbols-outlined">sms</span> Invite (SMS)
                        </a>
                        <button onClick={() => syncNow()} className="finals-btn finals-btn-ghost text-sm">
                            <span className="material-symbols-outlined">sync</span> Sync now
                        </button>
                        <button onClick={leave} className="finals-btn finals-btn-ghost text-sm">Stop syncing</button>
                    </div>
                </>
            ) : (
                <>
                    <p className="text-sm text-[var(--finals-muted)]">
                        Log on two phones and see each other&apos;s entries. Turn it on here, then send the invite to the other phone.
                    </p>
                    <button onClick={create} className="finals-btn finals-btn-primary w-full">Turn on family sync</button>
                    <div className="flex gap-2">
                        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Or enter a family code" className="finals-input" autoCapitalize="characters" />
                        <button onClick={join} className="finals-btn finals-btn-ghost mt-[0.35rem]">Join</button>
                    </div>
                    {error && <p role="alert" className="text-sm text-[var(--finals-red)]">{error}</p>}
                </>
            )}
        </section>
    )
}

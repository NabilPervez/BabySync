/**
 * Family sync: each phone keeps its own IndexedDB copy and periodically swaps
 * changes with /api/sync. Conflicts resolve per entry: the newest edit wins.
 */
import { db, type Log } from "@/lib/db"
import type { SyncLog, SyncRequest, SyncResponse } from "@/lib/sync-protocol"

const STATE_KEY = "babysync.sync"

interface SyncState {
    code: string | null
    cursor: number
    pushedAt: number
}

export type SyncStatus =
    | { kind: "off" }
    | { kind: "syncing" }
    | { kind: "ok", at: number }
    | { kind: "error", message: string }

function readState(): SyncState {
    try {
        const raw = localStorage.getItem(STATE_KEY)
        if (raw) return JSON.parse(raw)
    } catch { /* storage blocked */ }
    return { code: null, cursor: 0, pushedAt: 0 }
}

function writeState(s: SyncState) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)) } catch { /* storage blocked */ }
}

// ---- tiny observable status for the UI ----

let status: SyncStatus = { kind: "off" }
const listeners = new Set<() => void>()
function setStatus(s: SyncStatus) {
    status = s
    listeners.forEach(l => l())
}
export const syncStatusStore = {
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
    get: () => status,
    getServer: (): SyncStatus => ({ kind: "off" }),
}

export function getSyncCode() {
    return typeof window === "undefined" ? null : readState().code
}

/** Join (or create) a family. Everything on this phone is uploaded and merged. */
export async function joinFamily(code: string) {
    writeState({ code, cursor: 0, pushedAt: 0 })
    await syncNow()
}

export function leaveFamily() {
    writeState({ code: null, cursor: 0, pushedAt: 0 })
    setStatus({ kind: "off" })
}

// ---- the sync itself ----

let running: Promise<void> | null = null
let again = false

export function syncNow(): Promise<void> {
    if (running) {
        again = true
        return running
    }
    running = (async () => {
        try {
            do {
                again = false
                await syncOnce()
            } while (again)
        } finally {
            running = null
        }
    })()
    return running
}

let debounce: ReturnType<typeof setTimeout> | undefined
/** Called after every local write; batches bursts of edits. */
export function requestSync() {
    if (typeof window === "undefined" || !readState().code) return
    clearTimeout(debounce)
    debounce = setTimeout(() => { syncNow() }, 1200)
}

function toWire(l: Log): SyncLog {
    return {
        uid: l.uid, type: l.type, subtype: l.subtype, startTime: l.startTime,
        endTime: l.endTime, details: l.details, createdAt: l.createdAt, updatedAt: l.updatedAt,
    }
}

async function syncOnce() {
    const state = readState()
    if (!state.code) return setStatus({ kind: "off" })
    if (typeof navigator !== "undefined" && !navigator.onLine) {
        return setStatus({ kind: "error", message: "Offline — will sync when back online" })
    }
    setStatus({ kind: "syncing" })

    const startedAt = Date.now()
    const [changed, tombs, baby] = await Promise.all([
        db.logs.where("updatedAt").above(state.pushedAt).toArray(),
        db.tombstones.where("updatedAt").above(state.pushedAt).toArray(),
        db.babies.limit(1).first(),
    ])
    const body: SyncRequest = {
        code: state.code,
        cursor: state.cursor,
        changes: [
            ...changed.map(toWire),
            ...tombs.map(t => ({ uid: t.uid, updatedAt: t.updatedAt, deleted: true }) as SyncLog),
        ],
        profile: baby && (baby.updatedAt ?? 0) > state.pushedAt
            ? { name: baby.name, dob: baby.dob, sharePhone: baby.sharePhone, updatedAt: baby.updatedAt! }
            : undefined,
    }

    let res: Response
    try {
        res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    } catch {
        return setStatus({ kind: "error", message: "Can't reach the server" })
    }
    if (!res.ok) {
        const msg = await res.json().then(j => j.error).catch(() => res.statusText)
        return setStatus({ kind: "error", message: `Sync failed: ${msg}` })
    }
    const data: SyncResponse = await res.json()
    await applyRemote(data)

    // Only advance markers if the code wasn't changed mid-sync
    if (readState().code === state.code) writeState({ code: state.code, cursor: data.cursor, pushedAt: startedAt })
    setStatus({ kind: "ok", at: Date.now() })
}

async function applyRemote(data: SyncResponse) {
    await db.transaction("rw", db.logs, db.babies, db.tombstones, async () => {
        for (const r of data.changes) {
            const local = await db.logs.where("uid").equals(r.uid).first()
            if (r.deleted) {
                if (local && local.updatedAt <= r.updatedAt) await db.logs.delete(local.id)
                continue
            }
            const tomb = await db.tombstones.get(r.uid)
            if (tomb && tomb.updatedAt >= r.updatedAt) continue // deleted here after that edit
            if (local && local.updatedAt >= r.updatedAt) continue // ours is newer (or the same)
            const { deleted: _d, ...fields } = r
            await db.logs.put({ ...fields, ...(local ? { id: local.id } : {}) } as Log)
        }
        if (data.profile) {
            const baby = await db.babies.limit(1).first()
            if (!baby || (baby.updatedAt ?? 0) < data.profile.updatedAt) {
                await db.babies.put({ ...(baby ?? {}), ...data.profile } as never)
            }
        }
    })
}

/** Start background syncing: on load, every 30s while open, and when the app regains focus. */
export function startSyncLoop() {
    syncNow()
    const tick = () => { if (document.visibilityState === "visible") syncNow() }
    const t = setInterval(tick, 30_000)
    document.addEventListener("visibilitychange", tick)
    window.addEventListener("online", tick)
    return () => {
        clearInterval(t)
        document.removeEventListener("visibilitychange", tick)
        window.removeEventListener("online", tick)
    }
}

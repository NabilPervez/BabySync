/**
 * All app writes go through here so every change gets a uid/updatedAt (and deletes
 * leave a tombstone) — that's what the sync engine pushes to the other phone.
 */
import { db, newUid, type Baby, type Log } from "@/lib/db"
import { requestSync } from "@/lib/sync"

export type NewLog = Omit<Log, "id" | "uid" | "updatedAt"> & { uid?: string }

export async function addLog(log: NewLog) {
    const now = Date.now()
    const id = await db.logs.add({ ...log, uid: log.uid ?? newUid(), updatedAt: now } as Log)
    requestSync()
    return id
}

export async function updateLog(id: number, changes: Partial<Omit<Log, "id" | "uid">>) {
    await db.logs.update(id, { ...changes, updatedAt: Date.now() })
    requestSync()
}

/** Replace an existing entry (used by the edit form). Clears fields not provided. */
export async function replaceLog(existing: Log, next: NewLog) {
    await db.logs.put({ ...next, id: existing.id, uid: existing.uid, updatedAt: Date.now() } as Log)
    requestSync()
}

export async function deleteLog(log: Pick<Log, "id" | "uid">) {
    await db.transaction("rw", db.logs, db.tombstones, async () => {
        await db.logs.delete(log.id)
        if (log.uid) await db.tombstones.put({ uid: log.uid, updatedAt: Date.now() })
    })
    requestSync()
}

export async function saveProfile(existing: Baby | undefined, data: Omit<Baby, "id" | "updatedAt">) {
    const row = { ...data, updatedAt: Date.now() }
    if (existing) await db.babies.update(existing.id, row)
    else await db.babies.add(row as Baby)
    requestSync()
}

/** Wipes this device only. Synced data on the server and the other phone is untouched. */
export async function clearLocal() {
    await db.transaction("rw", db.logs, db.babies, db.tombstones, async () => {
        await db.logs.clear()
        await db.babies.clear()
        await db.tombstones.clear()
    })
}

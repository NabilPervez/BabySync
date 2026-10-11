import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"
import { NextResponse } from "next/server"
import { CODE_RE, LOG_TYPES, type SyncLog, type SyncProfile, type SyncRequest, type SyncResponse } from "@/lib/sync-protocol"

export const dynamic = "force-dynamic"

/** Everything one family has synced. Small: a busy year is ~15k entries. */
interface FamilyDoc {
    seq: number
    logs: Record<string, SyncLog & { seq: number }>
    profile?: SyncProfile & { seq: number }
}

const MAX_CHANGES = 5000
const MAX_BODY_BYTES = 2_000_000

// ---- storage: Netlify Blobs in production, a local file during `next dev` ----

interface Stored { doc: FamilyDoc, etag?: string }
interface Store {
    load(key: string): Promise<Stored | null>
    /** Returns false if someone else wrote first (caller retries). */
    save(key: string, doc: FamilyDoc, etag?: string): Promise<boolean>
}

async function getStoreImpl(): Promise<Store> {
    if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_SITE_ID) {
        const { getStore } = await import("@netlify/blobs")
        const store = getStore({ name: "babysync-families", consistency: "strong" })
        return {
            async load(key) {
                const r = await store.getWithMetadata(key, { type: "json" })
                return r ? { doc: r.data as FamilyDoc, etag: r.etag } : null
            },
            async save(key, doc, etag) {
                const r = await store.setJSON(key, doc, etag ? { onlyIfMatch: etag } : { onlyIfNew: true })
                return r.modified
            },
        }
    }
    const dir = path.join(process.cwd(), ".data")
    return {
        async load(key) {
            try {
                const text = await fs.readFile(path.join(dir, `${key}.json`), "utf8")
                return { doc: JSON.parse(text), etag: String(text.length) }
            } catch { return null }
        },
        async save(key, doc) {
            await fs.mkdir(dir, { recursive: true })
            await fs.writeFile(path.join(dir, `${key}.json`), JSON.stringify(doc))
            return true
        },
    }
}

// ---- validation ----

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)
const isStr = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max

function validLog(l: unknown): l is SyncLog {
    if (!l || typeof l !== "object") return false
    const o = l as Record<string, unknown>
    // A deletion only needs to say which entry and when
    if (o.deleted === true) return isStr(o.uid, 64) && o.uid.length > 0 && isNum(o.updatedAt)
    return isStr(o.uid, 64) && o.uid.length > 0
        && LOG_TYPES.includes(o.type as SyncLog["type"])
        && (o.subtype === undefined || isStr(o.subtype, 40))
        && isNum(o.startTime) && isNum(o.createdAt) && isNum(o.updatedAt)
        && (o.endTime === undefined || o.endTime === null || isNum(o.endTime))
        && (o.details === undefined || o.details === null || (typeof o.details === "object" && JSON.stringify(o.details).length < 4000))
}

function validProfile(p: unknown): p is SyncProfile {
    if (!p || typeof p !== "object") return false
    const o = p as Record<string, unknown>
    return isStr(o.name, 100) && isNum(o.dob) && isNum(o.updatedAt) && (o.sharePhone === undefined || isStr(o.sharePhone, 30))
}

function clean(l: SyncLog): SyncLog {
    if (l.deleted) return { uid: l.uid, type: "MOOD", startTime: 0, createdAt: 0, updatedAt: l.updatedAt, deleted: true }
    return {
        uid: l.uid, type: l.type, subtype: l.subtype, startTime: l.startTime,
        endTime: l.endTime ?? undefined, details: l.details ?? undefined,
        createdAt: l.createdAt, updatedAt: l.updatedAt, deleted: l.deleted ? true : undefined,
    }
}

// ---- handler ----

export async function POST(req: Request) {
    const text = await req.text()
    if (text.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Too large" }, { status: 413 })

    let body: SyncRequest
    try { body = JSON.parse(text) } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }) }

    if (!isStr(body.code, 40) || !CODE_RE.test(body.code)) return NextResponse.json({ error: "Bad sync code" }, { status: 400 })
    if (!isNum(body.cursor) || !Array.isArray(body.changes) || body.changes.length > MAX_CHANGES) {
        return NextResponse.json({ error: "Bad request" }, { status: 400 })
    }
    if (!body.changes.every(validLog)) return NextResponse.json({ error: "Bad entry" }, { status: 400 })
    if (body.profile !== undefined && !validProfile(body.profile)) return NextResponse.json({ error: "Bad profile" }, { status: 400 })

    // The code is the family's shared secret; only its hash is used as the storage key
    const key = createHash("sha256").update(body.code).digest("hex")
    const store = await getStoreImpl()

    for (let attempt = 0; attempt < 5; attempt++) {
        const stored = await store.load(key)
        const doc: FamilyDoc = stored?.doc ?? { seq: 0, logs: {} }

        // Last writer wins per entry, by the device's updatedAt
        for (const incoming of body.changes) {
            const existing = doc.logs[incoming.uid]
            if (!existing || incoming.updatedAt > existing.updatedAt) {
                doc.logs[incoming.uid] = { ...clean(incoming), seq: ++doc.seq }
            }
        }
        if (body.profile && (!doc.profile || body.profile.updatedAt > doc.profile.updatedAt)) {
            const { name, dob, sharePhone, updatedAt } = body.profile
            doc.profile = { name, dob, sharePhone, updatedAt, seq: ++doc.seq }
        }

        const changed = body.changes.length > 0 || !!body.profile
        if (changed && !(await store.save(key, doc, stored?.etag))) continue // lost a race; reload and retry

        const res: SyncResponse = {
            cursor: doc.seq,
            changes: Object.values(doc.logs).filter(l => l.seq > body.cursor).map(({ seq: _seq, ...l }) => l),
            profile: doc.profile && doc.profile.seq > body.cursor
                ? { name: doc.profile.name, dob: doc.profile.dob, sharePhone: doc.profile.sharePhone, updatedAt: doc.profile.updatedAt }
                : undefined,
        }
        return NextResponse.json(res, { headers: { "Cache-Control": "no-store" } })
    }
    return NextResponse.json({ error: "Busy, try again" }, { status: 409 })
}

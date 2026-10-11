/** Shapes shared by the sync API route and the client sync engine. */

export const LOG_TYPES = ["SLEEP", "FEED", "DIAPER", "ACTIVITY", "MEDICINE", "HEALTH", "MOOD"] as const

/** A log as it travels over the wire: keyed by `uid`, never by the local auto-increment id. */
export interface SyncLog {
    uid: string
    type: (typeof LOG_TYPES)[number]
    subtype?: string
    startTime: number
    endTime?: number
    details?: Record<string, unknown>
    createdAt: number
    updatedAt: number
    deleted?: boolean
}

export interface SyncProfile {
    name: string
    dob: number
    sharePhone?: string
    updatedAt: number
}

export interface SyncRequest {
    code: string
    /** Server sequence number the client has already seen */
    cursor: number
    changes: SyncLog[]
    profile?: SyncProfile
}

export interface SyncResponse {
    cursor: number
    changes: SyncLog[]
    profile?: SyncProfile
}

/** 4 groups of 5 chars from an unambiguous alphabet ≈ 100 bits. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
export const CODE_RE = /^[A-HJKMNP-Z2-9]{5}-[A-HJKMNP-Z2-9]{5}-[A-HJKMNP-Z2-9]{5}-[A-HJKMNP-Z2-9]{5}$/

export function normalizeCode(input: string) {
    const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "")
    return raw.match(/.{1,5}/g)?.join("-") ?? ""
}

export function newCode() {
    const bytes = crypto.getRandomValues(new Uint8Array(20))
    const chars = Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("")
    return chars.match(/.{5}/g)!.join("-")
}

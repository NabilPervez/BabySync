import Dexie, { type EntityTable } from 'dexie';

type LogType = 'SLEEP' | 'FEED' | 'DIAPER' | 'ACTIVITY' | 'MEDICINE' | 'HEALTH' | 'MOOD';

interface Log {
    id: number;
    /** Stable id shared across devices (the local `id` differs per phone) */
    uid: string;
    type: LogType;
    subtype?: string; // e.g. 'walk', 'lunch', 'potty_pee'
    startTime: number;
    endTime?: number; // set for timed entries (sleep, activities)
    details?: {
        amount?: number | string;
        unit?: string;
        notes?: string;
        [key: string]: unknown;
    };
    createdAt: number;
    /** Last local edit; drives sync "last edit wins" */
    updatedAt: number;
}

interface Baby {
    id: number;
    name: string;
    dob: number; // timestamp
    gender?: 'boy' | 'girl' | 'other';
    theme?: string;
    /** Phone number updates are sent to (digits, with country code) */
    sharePhone?: string;
    updatedAt?: number;
}

/** Remembers deletions so they can be synced to the other phone. */
interface Tombstone {
    uid: string;
    updatedAt: number;
}

const db = new Dexie('BabySyncDB') as Dexie & {
    logs: EntityTable<Log, 'id'>;
    babies: EntityTable<Baby, 'id'>;
    tombstones: EntityTable<Tombstone, 'uid'>;
};

db.version(1).stores({
    logs: '++id, type, subtype, startTime, createdAt',
    babies: '++id, name'
});

// v2: compound index so "latest of type X" is ordered by time, not insertion id
db.version(2).stores({
    logs: '++id, type, subtype, startTime, createdAt, [type+startTime]',
    babies: '++id, name'
});

// v3: sync support
db.version(3).stores({
    logs: '++id, &uid, type, subtype, startTime, createdAt, updatedAt, [type+startTime]',
    babies: '++id, name',
    tombstones: '&uid, updatedAt'
}).upgrade(tx => tx.table('logs').toCollection().modify(log => {
    log.uid ??= newUid();
    log.updatedAt ??= log.createdAt ?? Date.now();
}));

export function newUid() {
    return crypto.randomUUID();
}

/** Most recent log of a type, by startTime (not insertion order). */
export function latestOfType(type: LogType) {
    return db.logs
        .where('[type+startTime]')
        .between([type, Dexie.minKey], [type, Dexie.maxKey])
        .last();
}

export type { Log, Baby, LogType, Tombstone };
export { db };

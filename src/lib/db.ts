import Dexie, { type EntityTable } from 'dexie';

type LogType = 'SLEEP' | 'FEED' | 'DIAPER' | 'ACTIVITY' | 'MEDICINE' | 'HEALTH' | 'MOOD';

interface Log {
    id: number;
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
}

interface Baby {
    id: number;
    name: string;
    dob: number; // timestamp
    gender?: 'boy' | 'girl' | 'other';
    theme?: string;
    /** Phone number updates are sent to (digits, with country code) */
    sharePhone?: string;
}

const db = new Dexie('BabySyncDB') as Dexie & {
    logs: EntityTable<Log, 'id'>;
    babies: EntityTable<Baby, 'id'>;
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

/** Most recent log of a type, by startTime (not insertion order). */
export function latestOfType(type: LogType) {
    return db.logs
        .where('[type+startTime]')
        .between([type, Dexie.minKey], [type, Dexie.maxKey])
        .last();
}

export type { Log, Baby, LogType };
export { db };

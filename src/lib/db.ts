import Dexie, { type EntityTable } from 'dexie';

interface Log {
    id: number;
    type: 'SLEEP' | 'FEED' | 'DIAPER' | 'ACTIVITY';
    subtype?: string; // e.g., 'breast', 'bottle', 'wet', 'dirty'
    startTime: number;
    endTime?: number;
    details?: {
        amount?: number;
        unit?: string;
        notes?: string;
        [key: string]: any;
    };
    createdAt: number;
}

interface Baby {
    id: number;
    name: string;
    dob: number; // timestamp
    gender?: 'boy' | 'girl' | 'other';
    theme?: string;
}

const db = new Dexie('BabySyncDB') as Dexie & {
    logs: EntityTable<Log, 'id'>;
    babies: EntityTable<Baby, 'id'>;
};

// Schema declaration:
db.version(1).stores({
    logs: '++id, type, subtype, startTime, createdAt',
    babies: '++id, name'
});

export type { Log, Baby };
export { db };

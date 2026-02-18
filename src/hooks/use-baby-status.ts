import { useLiveQuery } from "dexie-react-hooks";
import { db, Log } from "@/lib/db";

export function useBabyStatus() {
    const lastSleep = useLiveQuery(async () => {
        // efficient index on type+endTime is best, but for MVP simple filter is OK
        // logs are filtered by type='SLEEP' and sorted by startTime desc
        const sleepLogs = await db.logs
            .where("type")
            .equals("SLEEP")
            .reverse()
            .sortBy("startTime");

        return sleepLogs[0];
    });

    const allLogs = useLiveQuery(() => db.logs.orderBy("startTime").reverse().toArray());

    const isSleeping = lastSleep && !lastSleep.endTime;

    // Awake duration: time since last sleep ended (or last log if no sleep?)
    // PRD: "Awake Timer" starts when sleep stops.
    // Actually, if baby is sleeping, awake timer is 0 or paused.

    const lastWakeTime = !isSleeping && lastSleep ? lastSleep.endTime : (allLogs && allLogs[0]?.startTime);

    // If no logs, assume awake since... forever? or 0.

    return {
        isSleeping: !!isSleeping,
        currentSleepStart: isSleeping ? lastSleep.startTime : null,
        lastWakeTime: lastWakeTime || Date.now(),
        lastSleepLog: lastSleep,
    };
}

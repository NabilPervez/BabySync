import { promises as fs } from 'fs';
import path from 'path';

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;

interface Log {
    type: 'SLEEP' | 'FEED' | 'DIAPER';
    startTime: number;
    endTime?: number;
    subtype?: string;
    details?: any;
    createdAt: number;
}

const logs: Log[] = [];
const today = new Date().setHours(0, 0, 0, 0);
const startDate = today - (30 * ONE_DAY);

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

for (let d = 0; d < 31; d++) {
    const currentDayStart = startDate + (d * ONE_DAY);
    let currentTime = currentDayStart;

    // Simulate a day
    // Wake up around 6-7 AM
    const wakeUpTime = currentDayStart + randomInt(6, 7) * ONE_HOUR + randomInt(0, 30) * ONE_MINUTE;

    // Previous night sleep ended at wakeUpTime? Let's ignore previous night for simplicity of generation loop, or assume it started yesterday.

    currentTime = wakeUpTime;

    // Day loop until bedtime (~7-8 PM)
    const bedtime = currentDayStart + randomInt(19, 20) * ONE_HOUR;

    while (currentTime < bedtime) {
        // 1. Eat
        logs.push({
            type: 'FEED',
            startTime: currentTime,
            subtype: Math.random() > 0.3 ? 'bottle' : 'nursing',
            details: { amount: randomInt(3, 8), unit: 'oz' },
            createdAt: currentTime
        });

        // 2. Diaper (sometimes)
        if (Math.random() > 0.4) {
            const diaperTime = currentTime + randomInt(15, 45) * ONE_MINUTE;
            const types = ['wet', 'wet', 'wet', 'dirty', 'mixed'];
            logs.push({
                type: 'DIAPER',
                startTime: diaperTime,
                subtype: types[randomInt(0, 4)],
                details: {},
                createdAt: diaperTime
            });
        }

        // 3. Play (awake time) -> 1.5 to 3 hours
        const wakeWindow = randomInt(90, 180) * ONE_MINUTE;
        const napStart = currentTime + wakeWindow;

        if (napStart >= bedtime) break;

        // 4. Nap -> 30m to 2h
        const napDuration = randomInt(30, 120) * ONE_MINUTE;
        logs.push({
            type: 'SLEEP',
            startTime: napStart,
            endTime: napStart + napDuration,
            subtype: 'nap',
            details: {},
            createdAt: napStart
        });

        currentTime = napStart + napDuration;
    }

    // Night Sleep
    logs.push({
        type: 'SLEEP',
        startTime: bedtime,
        endTime: bedtime + randomInt(10, 12) * ONE_HOUR, // sleeps 10-12 hours
        subtype: 'night',
        details: {},
        createdAt: bedtime
    });
}

// Convert to full JSON string
const jsonContent = JSON.stringify(logs, null, 2);

console.log(jsonContent);

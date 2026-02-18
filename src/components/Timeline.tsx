"use client"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { format, formatDistanceStrict } from "date-fns"

export function Timeline({ onEdit }: { onEdit: (log: any) => void }) {
    const logs = useLiveQuery(() => db.logs.orderBy("startTime").reverse().limit(50).toArray())

    if (!logs) return <div className="text-center p-4 text-muted-foreground animate-pulse">Loading history...</div>
    if (logs.length === 0) return <div className="text-center p-8 text-muted-foreground">No events yet. Start by logging something!</div>

    return (
        <div className="relative">
            <div className="absolute left-[59px] top-2 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800"></div>
            <div className="flex flex-col gap-6">
                {logs.map((log) => (
                    <div key={log.id} className="group flex items-start gap-4">
                        {/* Time Column */}
                        <div className="w-11 pt-1 flex flex-col items-end">
                            <span className="text-sm font-semibold text-slate-700 dark:text-blue-100">
                                {format(new Date(log.startTime), "h:mm")}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {format(new Date(log.startTime), "a")}
                            </span>
                        </div>

                        {/* Icon Column */}
                        <div className="relative z-10 flex-shrink-0">
                            {renderIcon(log)}
                        </div>

                        {/* Content Card with onClick trigger */}
                        <div className={`flex-1 bg-white dark:bg-surface-dark rounded-xl p-3 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5 
                ${log.type === 'SLEEP' ? 'opacity-90' : ''}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-slate-800 dark:text-blue-50 capitalize">
                                    {getLogTitle(log)}
                                </h3>
                                <button
                                    onClick={() => onEdit(log)}
                                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-sm">more_horiz</span>
                                </button>
                            </div>
                            {renderDetails(log)}
                        </div>
                    </div>
                ))}
                <div className="h-24"></div>
            </div>
        </div>
    )
}

function getLogTitle(log: any) {
    if (log.type === 'SLEEP') {
        return log.endTime ? 'Woke Up' : 'Started Sleep'
    }
    if (log.type === 'FEED') {
        return log.subtype === 'bottle' ? 'Formula/Bottle' : 'Nursing'
    }
    return `${log.subtype || ''} ${log.type.toLowerCase()}`
}

function renderIcon(log: any) {
    let iconName = 'schedule'
    let bgClass = 'bg-slate-50 dark:bg-slate-800'
    let textClass = 'text-slate-400'
    let borderClass = 'border-slate-100 dark:border-slate-700'
    let hoverBorder = 'group-hover:border-primary' // Default hover
    let hoverText = 'group-hover:text-primary' // Default hover

    switch (log.type) {
        case 'SLEEP':
            iconName = 'bedtime'
            bgClass = 'bg-indigo-50 dark:bg-slate-800'
            textClass = 'text-accent-lavender'
            borderClass = 'border-indigo-100 dark:border-slate-700'
            hoverBorder = 'group-hover:border-accent-lavender'
            hoverText = 'group-hover:text-accent-lavender'
            break
        case 'FEED':
            iconName = 'grocery' // 'restaurant' or 'baby_bottle' if available
            bgClass = 'bg-yellow-50 dark:bg-slate-800'
            textClass = 'text-amber-300'
            borderClass = 'border-yellow-100 dark:border-slate-700'
            hoverBorder = 'group-hover:border-accent-yellow'
            hoverText = 'group-hover:text-accent-yellow'
            break
        case 'DIAPER':
            iconName = 'water_drop'
            if (log.subtype === 'dirty') iconName = 'pest_control_rodent' // visual pun? or stick to generic

            bgClass = 'bg-blue-50 dark:bg-slate-800'
            textClass = 'text-blue-400'
            borderClass = 'border-blue-100 dark:border-slate-700'

            if (log.subtype === 'dirty') {
                bgClass = 'bg-rose-50 dark:bg-slate-800'
                textClass = 'text-rose-300'
                borderClass = 'border-rose-100 dark:border-slate-700'
                hoverBorder = 'group-hover:border-accent-rose'
                hoverText = 'group-hover:text-accent-rose'
            }
            break
    }

    return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
            ${bgClass} ${borderClass} ${textClass} ${hoverBorder} ${hoverText}`}
        >
            <span className="material-symbols-outlined text-[18px]">
                {iconName}
            </span>
        </div>
    )
}

function renderDetails(log: any) {
    if (log.type === 'SLEEP') {
        return (
            <p className="text-sm text-slate-500 dark:text-slate-400">
                {log.endTime ? `Slept for ${formatDistanceStrict(log.startTime, log.endTime)}` : 'Currently sleeping...'}
            </p>
        )
    }
    if (log.type === 'FEED') {
        return (
            <div className="flex items-center gap-2">
                {log.details?.amount && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-200">
                        {log.details.amount} {log.details.unit || 'oz'}
                    </span>
                )}
                {log.details?.notes && <span className="text-xs text-slate-400 dark:text-slate-500">{log.details.notes}</span>}
            </div>
        )
    }
    if (log.type === 'DIAPER') {
        return (
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                {log.details?.notes || log.subtype || 'Logged'}
            </p>
        )
    }
    return null;
}

"use client"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { format, formatDistanceStrict } from "date-fns"
import { Activity, Droplet, Moon, Milk, Utensils } from "lucide-react"

export function Timeline() {
    const logs = useLiveQuery(() => db.logs.orderBy("startTime").reverse().limit(50).toArray())

    if (!logs) return <div className="text-center p-4 text-muted-foreground animate-pulse">Loading history...</div>
    if (logs.length === 0) return <div className="text-center p-8 text-muted-foreground">No events yet. Start by logging something!</div>

    return (
        <div className="relative border-l-2 border-muted ml-6 my-6 space-y-6">
            {logs.map((log) => (
                <div key={log.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 bg-background p-1 rounded-full border-2 border-muted">
                        {getIcon(log.type)}
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                            {format(new Date(log.startTime), "h:mm a")}
                        </span>
                        <div className="bg-card border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-sm capitalize text-foreground">
                                    {log.subtype || log.type.toLowerCase()}
                                </span>
                                {log.endTime && (
                                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                        {formatDuration(log.startTime, log.endTime)}
                                    </span>
                                )}
                            </div>
                            {renderDetails(log)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function getIcon(type: string) {
    switch (type) {
        case 'SLEEP': return <Moon className="w-3 h-3 text-indigo-500" />
        case 'FEED': return <Milk className="w-3 h-3 text-rose-500" />
        case 'DIAPER': return <Droplet className="w-3 h-3 text-sky-500" />
        default: return <Activity className="w-3 h-3 text-emerald-500" />
    }
}

function renderDetails(log: any) {
    if (log.type === 'FEED') {
        return (
            <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                {log.details?.amount && <span>{log.details.amount} {log.details.unit || 'oz'}</span>}
                {log.details?.notes && <span>• {log.details.notes}</span>}
            </div>
        )
    }
    if (log.type === 'DIAPER') {
        return (
            <div className="text-xs text-muted-foreground mt-1 capitalize">
                {log.subtype} {log.details?.notes && `• ${log.details.notes}`}
            </div>
        )
    }
    return null;
}

function formatDuration(start: number, end: number) {
    return formatDistanceStrict(start, end)
}

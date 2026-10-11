"use client"
import { useState } from "react"
import { format, differenceInMonths } from "date-fns"
import { useLiveQuery } from "dexie-react-hooks"
import { LiveStateCard } from "@/components/LiveStateCard"
import { Timeline } from "@/components/Timeline"
import { AddActivityDrawer } from "@/components/AddActivityDrawer"
import { ShareDrawer } from "@/components/ShareDrawer"
import { BottomNav } from "@/components/BottomNav"
import { useNow } from "@/components/LiveStateCard"
import { SyncBadge } from "@/components/FamilySync"
import { LastActivityStats } from "@/components/LastActivityStats"
import { db, type Log, type LogType } from "@/lib/db"

export default function Home() {
  const now = useNow(60_000)
  const baby = useLiveQuery(() => db.babies.limit(1).first())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<Partial<Log> | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareLog, setShareLog] = useState<Log | null>(null)

  const openLog = (log: Partial<Log> | null) => {
    setEditingLog(log)
    setDrawerOpen(true)
  }
  const openShare = (log: Log | null) => {
    setShareLog(log)
    setShareOpen(true)
  }

  const months = baby?.dob ? differenceInMonths(now, baby.dob) : undefined
  const age = months === undefined ? "" : months < 24 ? `${months} mo` : `${Math.floor(months / 12)} yr ${months % 12} mo`

  return (
    <div className="finals-page">
      <header className="finals-header">
        <div className="min-w-0">
          <p className="finals-label flex items-center gap-2">{format(now, "EEEE, MMM d")} <SyncBadge /></p>
          <h1 className="finals-heading text-3xl truncate">
            {baby?.name || "BabySync"}
            {age && <span className="ml-2 text-base text-[var(--finals-muted)]">{age}</span>}
          </h1>
        </div>
        <button onClick={() => openShare(null)} className="finals-btn finals-btn-primary text-sm px-4" aria-label="Send today's recap by WhatsApp or SMS">
          <span className="material-symbols-outlined text-[20px]">send</span> Update
        </button>
      </header>

      <main className="finals-main space-y-5">
        <LiveStateCard onQuickLog={type => openLog({ type })} />
        <LastActivityStats onQuickLog={type => openLog({ type: type as LogType })} />
        <div>
          <h2 className="finals-heading text-xl mb-3">Timeline</h2>
          <Timeline onEdit={openLog} onShare={openShare} />
        </div>
      </main>

      <button onClick={() => openLog(null)} className="finals-fab" aria-label="Log an activity">
        <span className="material-symbols-outlined text-[34px]">add</span>
      </button>

      <AddActivityDrawer open={drawerOpen} onOpenChange={setDrawerOpen} defaultValues={editingLog} />
      <ShareDrawer open={shareOpen} onOpenChange={setShareOpen} log={shareLog} />
      <BottomNav />
    </div>
  )
}

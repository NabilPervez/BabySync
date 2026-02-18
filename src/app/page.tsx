"use client"
import { LiveStateCard } from "@/components/LiveStateCard"
import { Timeline } from "@/components/Timeline"
import { AddActivityDrawer } from "@/components/AddActivityDrawer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SettingsDrawer } from "@/components/SettingsDrawer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex justify-between items-center safe-top">
        <div>
          <h1 className="text-xl font-bold text-foreground font-heading">BabySync</h1>
          <p className="text-xs text-muted-foreground">Today's Log</p>
        </div>
        <SettingsDrawer />
      </header>

      <div className="p-4 space-y-8 max-w-md mx-auto">
        <LiveStateCard />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Activity</h2>
          </div>
          <Timeline />
        </div>
      </div>

      <AddActivityDrawer />
    </main>
  )
}

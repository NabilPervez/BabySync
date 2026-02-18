"use client"
import { LiveStateCard } from "@/components/LiveStateCard"
import { Timeline } from "@/components/Timeline"
import { AddActivityDrawer } from "@/components/AddActivityDrawer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SettingsDrawer } from "@/components/SettingsDrawer"
import { BottomNav } from "@/components/BottomNav"
import { format } from "date-fns"

export default function Home() {
  const today = format(new Date(), "EEEE, MMM d") // e.g., "Monday, Oct 24"

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col overflow-hidden relative font-[var(--font-display)]">

      {/* Background Gradients */}
      <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-background-light dark:from-background-dark to-transparent pointer-events-none z-10"></div>
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent pointer-events-none z-10"></div>

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-6 pb-4 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 safe-top">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-blue-50">BabySync</h1>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">{today}</span>
        </div>

        <SettingsDrawer trigger={
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 text-slate-600 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </div>
        } />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 px-5 relative z-10">
        <div className="mt-4 mb-8">
          <LiveStateCard />
        </div>

        <div className="relative">
          <Timeline />
        </div>
      </main>

      {/* FAB - Add Activity */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
        <AddActivityDrawer />
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  )
}

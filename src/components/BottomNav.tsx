"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SettingsDrawer } from '@/components/SettingsDrawer'

export function BottomNav() {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-20 bg-background-light/95 dark:bg-surface-darker/95 backdrop-blur-lg border-t border-slate-200 dark:border-white/5 pb-safe pt-2">
            <div className="flex items-center justify-between px-6 pb-4">
                <Link
                    href="/"
                    className={`flex flex-col items-center gap-1 group ${isActive('/') ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                >
                    <div className={`p-1 rounded-full transition-colors ${isActive('/') ? '' : 'group-hover:bg-blue-50 dark:group-hover:bg-slate-800'}`}>
                        <span className={`material-symbols-outlined ${isActive('/') ? 'filled' : ''}`}>dashboard</span>
                    </div>
                    <span className="text-[10px] font-medium">Dashboard</span>
                </Link>

                <Link
                    href="/trends"
                    className={`flex flex-col items-center gap-1 group ${isActive('/trends') ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                >
                    <div className={`p-1 rounded-full transition-colors ${isActive('/trends') ? '' : 'group-hover:bg-blue-50 dark:group-hover:bg-slate-800'}`}>
                        <span className={`material-symbols-outlined ${isActive('/trends') ? 'filled' : ''}`}>bar_chart</span>
                    </div>
                    <span className="text-[10px] font-medium">Trends</span>
                </Link>

                {/* Settings is now a drawer, so we wrap it or just use the button style */}
                <div className="flex flex-col items-center gap-1 group text-slate-400 dark:text-slate-500 cursor-pointer">
                    <SettingsDrawer trigger={
                        <div className="flex flex-col items-center gap-1">
                            <div className="p-1 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-slate-800 transition-colors">
                                <span className="material-symbols-outlined">settings</span>
                            </div>
                            <span className="text-[10px] font-medium">Settings</span>
                        </div>
                    } />
                </div>
            </div>
        </nav>
    )
}

"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SettingsDrawer } from "@/components/SettingsDrawer"

const LINKS = [
    { href: "/", icon: "home", label: "Today" },
    { href: "/trends", icon: "bar_chart", label: "Trends" },
    { href: "/calendar", icon: "calendar_month", label: "History" },
]

export function BottomNav() {
    const pathname = usePathname()
    const [settingsOpen, setSettingsOpen] = useState(false)

    return (
        <nav className="finals-nav fixed bottom-0 inset-x-0 z-30" aria-label="Main">
            <div className="mx-auto max-w-md grid grid-cols-4">
                {LINKS.map(l => {
                    const active = pathname === l.href
                    return (
                        <Link key={l.href} href={l.href} className="finals-nav-item" data-active={active} aria-current={active ? "page" : undefined}>
                            <span className="material-symbols-outlined">{l.icon}</span>
                            <span>{l.label}</span>
                        </Link>
                    )
                })}
                <button onClick={() => setSettingsOpen(true)} className="finals-nav-item">
                    <span className="material-symbols-outlined">settings</span>
                    <span>Settings</span>
                </button>
            </div>
            <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
        </nav>
    )
}

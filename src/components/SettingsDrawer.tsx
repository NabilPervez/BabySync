"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { format } from "date-fns"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { db, newUid, type Baby, type Log } from "@/lib/db"
import { clearLocal, saveProfile } from "@/lib/data"
import { getSyncCode, leaveFamily, requestSync } from "@/lib/sync"
import { FamilySync } from "@/components/FamilySync"

export function SettingsDrawer({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
    // Wrap in an object: a missing profile (undefined) must not look like "still loading"
    const loaded = useLiveQuery(async () => ({ baby: await db.babies.limit(1).first() }))
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="finals-drawer">
                <div className="mx-auto w-full max-w-md overflow-y-auto max-h-[85dvh]">
                    <DrawerHeader className="text-left">
                        <DrawerTitle className="finals-heading text-2xl">Settings</DrawerTitle>
                        <DrawerDescription className="sr-only">Profile and data</DrawerDescription>
                    </DrawerHeader>
                    {open && loaded && <SettingsForm key={loaded.baby?.id ?? "new"} baby={loaded.baby} onDone={() => onOpenChange(false)} />}
                </div>
            </DrawerContent>
        </Drawer>
    )
}

function SettingsForm({ baby, onDone }: { baby: Baby | undefined, onDone: () => void }) {
    const [name, setName] = useState(baby?.name ?? "")
    const [dob, setDob] = useState(baby?.dob ? format(baby.dob, "yyyy-MM-dd") : "")
    const [phone, setPhone] = useState(baby?.sharePhone ?? "")

    const save = async () => {
        const data = {
            name: name.trim(),
            // Parse as a local date; `new Date("yyyy-mm-dd")` is UTC and shifts a day in the US
            dob: dob ? new Date(`${dob}T00:00`).getTime() : 0,
            sharePhone: phone.trim(),
        }
        await saveProfile(baby, data)
        onDone()
    }

    const exportData = async () => {
        const blob = new Blob([JSON.stringify({ babies: await db.babies.toArray(), logs: await db.logs.toArray() }, null, 2)], { type: "application/json" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = `babysync-backup-${format(Date.now(), "yyyy-MM-dd")}.json`
        a.click()
        URL.revokeObjectURL(a.href)
    }

    const importData = async (file: File) => {
        try {
            const parsed = JSON.parse(await file.text())
            if (!Array.isArray(parsed.logs)) throw new Error("No logs in file")
            if (!confirm(`Add ${parsed.logs.length} entries from this backup? Entries you already have are skipped.`)) return
            const now = Date.now()
            await db.transaction("rw", db.logs, db.babies, async () => {
                const have = new Set((await db.logs.toArray()).map(l => l.uid))
                // Older backups have no uid; give them one. Drop local ids so they don't collide.
                const rows = (parsed.logs as Log[])
                    .map(({ id: _id, ...l }) => ({ ...l, uid: l.uid ?? newUid(), updatedAt: now }))
                    .filter(l => !have.has(l.uid))
                await db.logs.bulkAdd(rows as Log[])
                if (!(await db.babies.count()) && parsed.babies?.[0]) {
                    const { id: _id, ...b } = parsed.babies[0]
                    await db.babies.add({ ...b, updatedAt: now })
                }
            })
            requestSync()
            onDone()
        } catch (e) {
            alert(`Couldn't import that file: ${(e as Error).message}`)
        }
    }

    const clearAll = async () => {
        const synced = !!getSyncCode()
        const msg = synced
            ? "Erase everything on THIS phone and disconnect from family sync? The other phone keeps its data."
            : "Delete ALL entries and the profile? Export a backup first if you might want them."
        if (!confirm(msg)) return
        if (synced) leaveFamily()
        await clearLocal()
        onDone()
    }

    return (
        <div className="px-4 pb-6 space-y-4">
            <label className="block">
                <span className="finals-label">Child&apos;s name</span>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="finals-input" />
            </label>
            <label className="block">
                <span className="finals-label">Birthday</span>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="finals-input" />
            </label>
            <label className="block">
                <span className="finals-label">Send updates to (phone, with country code)</span>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" className="finals-input" />
                <span className="block mt-1 text-xs text-[var(--finals-muted)]">Used for the WhatsApp and SMS buttons. Leave blank to pick a contact each time.</span>
            </label>
            <button onClick={save} className="finals-btn finals-btn-primary w-full">Save</button>

            <FamilySync />

            <div className="pt-4 border-t border-[var(--finals-line)] grid grid-cols-2 gap-3">
                <button onClick={exportData} className="finals-btn finals-btn-ghost">
                    <span className="material-symbols-outlined">download</span> Backup
                </button>
                <label className="finals-btn finals-btn-ghost cursor-pointer">
                    <span className="material-symbols-outlined">upload</span> Restore
                    <input type="file" accept="application/json" className="sr-only" onChange={e => e.target.files?.[0] && importData(e.target.files[0])} />
                </label>
                <button onClick={clearAll} className="finals-btn finals-btn-ghost col-span-2 text-[var(--finals-red)]">
                    <span className="material-symbols-outlined">delete_forever</span> Erase all data
                </button>
            </div>
            <p className="text-xs text-[var(--finals-muted)]">Data is kept on this phone, and on the BabySync server only if you turn on family sync.</p>
        </div>
    )
}

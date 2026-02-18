"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Settings, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export function SettingsDrawer({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const { theme, setTheme } = useTheme()

    const baby = useLiveQuery(async () => {
        return await db.babies.limit(1).first()
    })

    // Form handling
    const { register, handleSubmit, setValue, reset } = useForm({
        defaultValues: {
            name: "",
            dob: "",
        }
    })

    // Load existing data
    useEffect(() => {
        if (baby) {
            setValue("name", baby.name)
            if (baby.dob) {
                setValue("dob", new Date(baby.dob).toISOString().split("T")[0])
            }
        }
    }, [baby, setValue])

    const onSave = async (data: any) => {
        try {
            const babyData = {
                name: data.name,
                dob: data.dob ? new Date(data.dob).getTime() : Date.now(),
            }

            if (baby) {
                await db.babies.update(baby.id, babyData)
            } else {
                await db.babies.add(babyData)
            }
            setOpen(false)
        } catch (error) {
            console.error("Failed to save settings:", error)
        }
    }

    const handleClearData = async () => {
        if (confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
            await db.logs.clear()
            await db.babies.clear()
            alert("Data cleared.")
            setOpen(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {trigger ? (
                    <button>{trigger}</button> // Wrap in button if needed for asChild props behavior
                ) : (
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Settings</DrawerTitle>
                    </DrawerHeader>

                    <div className="p-4 space-y-6">
                        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Baby Name</Label>
                                <Input id="name" {...register("name")} placeholder="Baby's Name" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input id="dob" type="date" {...register("dob")} />
                            </div>

                            <div className="space-y-2">
                                <Label>App Theme</Label>
                                <ToggleGroup type="single" value={theme} onValueChange={(val) => val && setTheme(val)} className="justify-start">
                                    <ToggleGroupItem value="light" aria-label="Light Mode">Light</ToggleGroupItem>
                                    <ToggleGroupItem value="dark" aria-label="Dark Mode">Dark</ToggleGroupItem>
                                    <ToggleGroupItem value="system" aria-label="System Theme">System</ToggleGroupItem>
                                </ToggleGroup>
                            </div>

                            <Button type="submit" className="w-full gap-2">
                                <Save className="w-4 h-4" /> Save Profile
                            </Button>
                        </form>

                        <div className="pt-4 border-t">
                            <Button variant="destructive" onClick={handleClearData} className="w-full gap-2 opacity-90 hover:opacity-100">
                                <Trash2 className="w-4 h-4" /> Clear All Data
                            </Button>
                        </div>
                    </div>

                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

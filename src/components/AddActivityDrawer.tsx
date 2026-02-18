"use client"
// We'll rename the existing AddActivityDrawer to keep it, but we need to integrate the FAB button into page.tsx directly
// Actually, AddActivityDrawer exports a component that renders the trigger button.
// The user's HTML shows a specific FAB button design:
/* <button class="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-[0_8px_30px_rgba(96,165,250,0.4)] hover:scale-105 active:scale-95 transition-all border-2 border-white dark:border-surface-dark">
   <span class="material-symbols-outlined text-[32px]">add</span>
   </button> */

import { useState } from "react"
import { Plus, Milk, Droplet } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { db } from "@/lib/db"
import { useForm } from "react-hook-form"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export function AddActivityDrawer() {
    const [open, setOpen] = useState(false)

    const handleSave = async (data: any) => {
        try {
            if (data.type === 'DIAPER' && !data.subtype) {
            }

            await db.logs.add({
                ...data,
                startTime: Date.now(),
                createdAt: Date.now(),
            })
            setOpen(false)
        } catch (error) {
            console.error("Failed to save log:", error)
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <button className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-[0_8px_30px_rgba(96,165,250,0.4)] hover:scale-105 active:scale-95 transition-all border-2 border-white dark:border-surface-dark">
                    <span className="material-symbols-outlined text-[32px]">add</span>
                </button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Log Activity</DrawerTitle>
                    </DrawerHeader>
                    <Tabs defaultValue="feed" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="feed">Feed</TabsTrigger>
                            <TabsTrigger value="diaper">Diaper</TabsTrigger>
                        </TabsList>
                        <TabsContent value="feed" className="p-4 space-y-4">
                            <FeedForm onSave={handleSave} />
                        </TabsContent>
                        <TabsContent value="diaper" className="p-4 space-y-4">
                            <DiaperForm onSave={handleSave} />
                        </TabsContent>
                    </Tabs>
                    <DrawerFooter className="pt-2">
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

function FeedForm({ onSave }: { onSave: (data: any) => void }) {
    const { register, handleSubmit, setValue, watch, reset } = useForm({
        defaultValues: { type: 'bottle', amount: '', notes: '' }
    })
    const feedType = watch('type')

    const onSubmit = (data: any) => {
        onSave({
            type: 'FEED',
            subtype: data.type,
            details: { amount: data.amount, unit: 'oz', notes: data.notes }
        })
        reset()
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant={feedType === 'bottle' ? 'default' : 'outline'}
                    onClick={() => setValue('type', 'bottle')}
                    className="flex-1"
                >
                    Bottle
                </Button>
                <Button
                    type="button"
                    variant={feedType === 'breast' ? 'default' : 'outline'}
                    onClick={() => setValue('type', 'breast')}
                    className="flex-1"
                >
                    Nursing
                </Button>
            </div>

            <div className="space-y-2">
                <Label htmlFor="amount">Amount (oz)</Label>
                <Input id="amount" type="number" step="0.5" {...register("amount")} placeholder="4.0" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...register("notes")} placeholder="Details..." />
            </div>

            <Button type="submit" className="w-full">Save Feed</Button>
        </form>
    )
}

function DiaperForm({ onSave }: { onSave: (data: any) => void }) {
    const { register, handleSubmit, setValue, watch, reset } = useForm({
        defaultValues: { type: 'wet', notes: '' }
    })
    const diaperType = watch('type')

    const onSubmit = (data: any) => {
        onSave({
            type: 'DIAPER',
            subtype: data.type, // 'wet' | 'dirty' | 'mixed'
            details: { notes: data.notes }
        })
        reset()
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
                <Button
                    type="button"
                    variant={diaperType === 'wet' ? 'default' : 'outline'}
                    onClick={() => setValue('type', 'wet')}
                >
                    Wet
                </Button>
                <Button
                    type="button"
                    variant={diaperType === 'dirty' ? 'default' : 'outline'}
                    onClick={() => setValue('type', 'dirty')}
                >
                    Dirty
                </Button>
                <Button
                    type="button"
                    variant={diaperType === 'mixed' ? 'default' : 'outline'}
                    onClick={() => setValue('type', 'mixed')}
                >
                    Mixed
                </Button>
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...register("notes")} placeholder="Color, consistency..." />
            </div>

            <Button type="submit" className="w-full">Save Diaper</Button>
        </form>
    )
}

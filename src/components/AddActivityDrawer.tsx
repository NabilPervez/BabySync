"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
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

interface AddActivityDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultValues?: any // Should ideally be Log type
    trigger?: React.ReactNode
}

export function AddActivityDrawer({ open, onOpenChange, defaultValues, trigger }: AddActivityDrawerProps) {
    const isEditing = !!defaultValues && !!defaultValues.id

    // Determine default tab based on edited item type
    let defaultTab = "feed"
    if (defaultValues?.type === "DIAPER") defaultTab = "diaper"
    // If we support editing SLEEP later, we might need another tab or handling

    const handleSave = async (data: any) => {
        try {
            const logData = {
                ...data,
                // If editing, keep original startTime unless we add date picker later
                startTime: defaultValues?.startTime || Date.now(),
                // If editing, keep original createdAt
                createdAt: defaultValues?.createdAt || Date.now(),
            }

            if (isEditing) {
                await db.logs.update(defaultValues.id, logData)
            } else {
                await db.logs.add(logData)
            }

            onOpenChange(false)
        } catch (error) {
            console.error("Failed to save log:", error)
        }
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>{isEditing ? "Edit Activity" : "Log Activity"}</DrawerTitle>
                    </DrawerHeader>
                    <Tabs defaultValue={defaultTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="feed">Feed</TabsTrigger>
                            <TabsTrigger value="diaper">Diaper</TabsTrigger>
                        </TabsList>
                        <TabsContent value="feed" className="p-4 space-y-4">
                            <FeedForm onSave={handleSave} defaultValues={defaultValues?.type === 'FEED' ? defaultValues : undefined} />
                        </TabsContent>
                        <TabsContent value="diaper" className="p-4 space-y-4">
                            <DiaperForm onSave={handleSave} defaultValues={defaultValues?.type === 'DIAPER' ? defaultValues : undefined} />
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

function FeedForm({ onSave, defaultValues }: { onSave: (data: any) => void, defaultValues?: any }) {
    // Flatten default values for form
    const formDefaults = {
        type: defaultValues?.subtype || 'bottle',
        // If subtype is 'puree' or 'whole', we want the main type toggle to be 'food' and foodType to be set
        amount: defaultValues?.details?.amount || '',
        notes: defaultValues?.details?.notes || '',
        foodType: (defaultValues?.subtype === 'puree' || defaultValues?.subtype === 'whole') ? defaultValues.subtype : 'puree'
    }

    // Adjust type for form if it's a food subtype
    if (defaultValues?.subtype === 'puree' || defaultValues?.subtype === 'whole') {
        formDefaults.type = 'food'
    }

    const { register, handleSubmit, setValue, watch, reset } = useForm({
        defaultValues: formDefaults
    })

    // Watch type to conditionally render food options
    const feedType = watch('type')
    const foodType = watch('foodType')

    // Reset form when defaultValues changes (e.g. switching between add/edit)
    useEffect(() => {
        reset(formDefaults)
    }, [defaultValues])

    const onSubmit = (data: any) => {
        let subtype = data.type
        // If type is food, use the foodType as the actual subtype or keep 'food' and details?
        // User requested subsection: Puree, Whole. 
        if (data.type === 'food') {
            subtype = data.foodType // 'puree' or 'whole'
        }

        onSave({
            type: 'FEED',
            subtype: subtype,
            details: {
                amount: data.amount,
                unit: 'oz', // Food might use grams or just text? Keeping oz/unit simple for now
                notes: data.notes
            }
        })
        if (!defaultValues) reset() // Only reset if adding new
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
                <Button
                    type="button"
                    variant={feedType === 'food' ? 'default' : 'outline'}
                    onClick={() => setValue('type', 'food')}
                    className="flex-1"
                >
                    Food
                </Button>
            </div>

            {feedType === 'food' && (
                <div className="p-3 bg-secondary/50 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label>Food Type</Label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={foodType === 'puree' ? 'default' : 'outline'}
                            onClick={() => setValue('foodType', 'puree')}
                            className="flex-1"
                        >
                            Puree
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={foodType === 'whole' ? 'default' : 'outline'}
                            onClick={() => setValue('foodType', 'whole')}
                            className="flex-1"
                        >
                            Whole
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="amount">Amount {feedType === 'food' ? '(qty/oz)' : '(oz)'}</Label>
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

function DiaperForm({ onSave, defaultValues }: { onSave: (data: any) => void, defaultValues?: any }) {
    const formDefaults = {
        type: defaultValues?.subtype || 'wet',
        notes: defaultValues?.details?.notes || ''
    }

    const { register, handleSubmit, setValue, watch, reset } = useForm({
        defaultValues: formDefaults
    })
    const diaperType = watch('type')

    useEffect(() => {
        reset(formDefaults)
    }, [defaultValues])

    const onSubmit = (data: any) => {
        onSave({
            type: 'DIAPER',
            subtype: data.type,
            details: { notes: data.notes }
        })
        if (!defaultValues) reset()
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

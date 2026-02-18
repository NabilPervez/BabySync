"use client"
import { BottomNav } from "@/components/BottomNav"

export default function TrendsPage() {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white antialiased selection:bg-primary/30 min-h-screen">
            <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark">
                {/* Header */}
                <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-12 pb-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-blue-100 dark:border-white/5 safe-top">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Trends</h1>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <span>Last 7 Days</span>
                        <span className="material-symbols-outlined text-[16px]">expand_more</span>
                    </button>
                </header>

                {/* Content */}
                <main className="flex-1 flex flex-col gap-6 px-4 py-6 pb-24">

                    {/* Sleep Duration Chart */}
                    <section className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-secondary text-[20px]">bedtime</span>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Sleep Duration</h2>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">14h 20m</span>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">avg</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Night</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Day</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative h-48 w-full mt-2">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                <div className="w-full border-t border-dashed border-slate-200 dark:border-white/10"></div>
                                <div className="w-full border-t border-dashed border-slate-200 dark:border-white/10"></div>
                                <div className="w-full border-t border-dashed border-slate-200 dark:border-white/10"></div>
                                <div className="w-full border-t border-dashed border-slate-200 dark:border-white/10"></div>
                            </div>

                            {/* Bars */}
                            <div className="absolute inset-0 flex items-end justify-between px-2 pt-2">
                                {/* Fake data bars strictly from provided HTML */}
                                <div className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                                    <div className="relative w-2.5 sm:w-4 rounded-full overflow-hidden flex flex-col-reverse h-32 bg-slate-100 dark:bg-white/5 transition-all group-hover:scale-110">
                                        <div className="w-full bg-primary h-[60%]"></div>
                                        <div className="w-full bg-secondary h-[25%]"></div>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">M</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                                    <div className="relative w-2.5 sm:w-4 rounded-full overflow-hidden flex flex-col-reverse h-40 bg-slate-100 dark:bg-white/5 transition-all group-hover:scale-110">
                                        <div className="w-full bg-primary h-[55%]"></div>
                                        <div className="w-full bg-secondary h-[30%]"></div>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">T</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                                    <div className="relative w-2.5 sm:w-4 rounded-full overflow-hidden flex flex-col-reverse h-28 bg-slate-100 dark:bg-white/5 transition-all group-hover:scale-110">
                                        <div className="w-full bg-primary h-[50%]"></div>
                                        <div className="w-full bg-secondary h-[20%]"></div>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">W</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                                    <div className="relative w-2.5 sm:w-4 rounded-full overflow-hidden flex flex-col-reverse h-36 bg-slate-100 dark:bg-white/5 transition-all group-hover:scale-110">
                                        <div className="w-full bg-primary h-[65%]"></div>
                                        <div className="w-full bg-secondary h-[25%]"></div>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">T</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                                    <div className="relative w-2.5 sm:w-4 rounded-full overflow-hidden flex flex-col-reverse h-44 bg-slate-100 dark:bg-white/5 transition-all group-hover:scale-110">
                                        <div className="w-full bg-primary h-[70%]"></div>
                                        <div className="w-full bg-secondary h-[20%]"></div>
                                    </div>
                                    <span className="text-[10px] font-medium text-primary font-bold">F</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                                    <div className="relative w-2.5 sm:w-4 rounded-full overflow-hidden flex flex-col-reverse h-32 bg-slate-100 dark:bg-white/5 transition-all group-hover:scale-110">
                                        <div className="w-full bg-primary h-[50%]"></div>
                                        <div className="w-full bg-secondary h-[35%]"></div>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">S</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                                    <div className="relative w-2.5 sm:w-4 rounded-full overflow-hidden flex flex-col-reverse h-24 bg-slate-100 dark:bg-white/5 transition-all group-hover:scale-110">
                                        <div className="w-full bg-primary h-[40%]"></div>
                                        <div className="w-full bg-secondary h-[30%]"></div>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">S</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Daily Intake Chart */}
                    <section className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-primary text-[20px]">water_drop</span>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Daily Intake</h2>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">28 oz</span>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">today</span>
                                </div>
                            </div>
                            <div className="px-2 py-1 bg-rose-50 rounded text-xs font-medium text-rose-500 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">trending_down</span>
                                5%
                            </div>
                        </div>

                        <div className="relative h-40 w-full mt-2">
                            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 100">
                                <defs>
                                    <linearGradient id="gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"></stop>
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"></stop>
                                    </linearGradient>
                                </defs>
                                <path d="M0,80 C40,80 50,40 100,50 C150,60 180,30 220,35 C260,40 280,20 300,25 V100 H0 Z" fill="url(#gradient)"></path>
                                <path d="M0,80 C40,80 50,40 100,50 C150,60 180,30 220,35 C260,40 280,20 300,25" fill="none" stroke="#3b82f6" strokeLinecap="round" strokeWidth="3" vectorEffect="non-scaling-stroke"></path>
                                <circle cx="300" cy="25" fill="#1e293b" r="4" stroke="#3b82f6" strokeWidth="2"></circle>
                            </svg>
                            <div className="absolute -bottom-6 inset-x-0 flex justify-between px-1">
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                    <span key={i} className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{day}</span>
                                ))}
                            </div>
                        </div>
                        <div className="h-4"></div>
                    </section>

                    {/* Today's Output */}
                    <section className="flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-blue-100 dark:border-white/5 shadow-sm shadow-blue-500/5">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px]">layers</span>
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Today's Output</h2>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total: 8</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-pastel-blue/50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-300">
                                    <span className="material-symbols-outlined text-[24px]">water_drop</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-slate-800 dark:text-white">6</span>
                                    <span className="text-xs font-medium text-blue-500 dark:text-blue-300/80 uppercase tracking-wider">Wet</span>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-pastel-purple/50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-500 dark:text-purple-300">
                                    <span className="material-symbols-outlined text-[24px]">pest_control_rodent</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-slate-800 dark:text-white">2</span>
                                    <span className="text-xs font-medium text-purple-500 dark:text-purple-300/80 uppercase tracking-wider">Dirty</span>
                                </div>
                            </div>
                        </div>
                    </section>

                </main>

                <BottomNav />
            </div>
        </div>
    )
}

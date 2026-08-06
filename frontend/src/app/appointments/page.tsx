"use client"

import { useEffect } from "react"
import { CalendarDays, Clock } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import Sidebar from "@/components/Sidebar"

export default function AppointmentsPage() {
    const { checkAuth } = useAuthStore()

    useEffect(() => { checkAuth() }, [checkAuth])

    return (
        <div className="app-shell flex min-h-screen">
            <Sidebar />
            <main className="ml-72 flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <p className="eyebrow">Care scheduling</p>
                        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Appointments are not live yet</h1>
                        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">Doctor availability and live booking are temporarily unavailable.</p>
                    </div>

                    <div className="patient-surface rounded-lg p-10">
                        <CalendarDays className="h-7 w-7 text-teal" />
                        <h3 className="mt-5 font-display text-3xl font-semibold text-ink">Appointment booking is turned off for now</h3>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                            This feature needs real-time doctor availability before patients can choose a doctor reliably. Please use the Risk Assessment page in the meantime.
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-[#e1c991] bg-[#fff8e8] px-3 py-2 text-xs font-semibold text-clay">
                            <Clock className="h-3.5 w-3.5" /> Temporarily unavailable
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

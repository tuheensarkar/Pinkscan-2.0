"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import {
    Activity,
    FileText,
    LayoutDashboard,
    LogOut,
    MessageCircle,
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Assessment", href: "/predict", icon: Activity },
    { label: "Community", href: "/community", icon: MessageCircle },
    { label: "Reports", href: "/reports", icon: FileText, patientOnly: true },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout, checkAuth } = useAuthStore()
    const isDoctor = user?.role === "doctor"

    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    useEffect(() => {
        if (typeof window !== "undefined" && !localStorage.getItem("token")) {
            router.replace("/auth/login")
        }
    }, [router])

    const handleLogout = () => {
        logout()
        router.push("/")
    }

    return (
        <aside className="nav-shell fixed inset-y-4 left-4 z-20 flex w-64 flex-col rounded-lg">
            <div className="border-b border-border px-5 py-5">
                <Link href="/dashboard" className="group flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal/30 bg-scrub overflow-hidden">
                        <Image src="/logo.png" alt="PinkScan Logo" width={36} height={36} className="object-cover" />
                    </div>
                    <div>
                        <p className="font-display text-xl font-semibold leading-none text-ink">PinkScan</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">care tools</p>
                    </div>
                </Link>
            </div>

            <div className="px-5 py-4">
                <p className="eyebrow">{isDoctor ? "Clinical workspace" : "Patient pathway"}</p>
                <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {isDoctor
                        ? "Review model outputs, notes, and report-ready summaries."
                        : "Complete assessments, understand results, and keep reports ready for care visits."}
                </p>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-2">
                {navItems.filter(item => !item.patientOnly || user?.role === "patient").map((item) => {
                    const active = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${active
                                ? "bg-teal text-white"
                                : "text-slate-600 hover:bg-scrub hover:text-ink dark:text-slate-300"
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t border-border p-4">
                <div className="mb-3 rounded-md border border-border bg-paper/70 p-3">
                    <p className="truncate text-sm font-semibold text-ink">{user?.full_name || user?.email || "User"}</p>
                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">{user?.role || "patient"} account</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-[#fff1f4] hover:text-rose-med dark:text-slate-300"
                >
                    <LogOut className="h-4 w-4" />
                    Sign out
                </button>
            </div>
        </aside>
    )
}

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileText,
    Loader2,
    MessageCircle,
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import Sidebar from "@/components/Sidebar"
import { RiskLens } from "@/components/RiskLens"
import { api } from "@/lib/axios"
import {
    getDoctorClinicalStats,
    getPatientRiskStats,
    timeAgo,
    type PredictionRecord,
} from "@/lib/predictionStats"

export default function DashboardPage() {
    const { user, checkAuth } = useAuthStore()
    const [predictions, setPredictions] = useState<PredictionRecord[]>([])
    const [loading, setLoading] = useState(true)
    const isDoctor = user?.role === "doctor"

    const fetchHistory = useCallback(async () => {
        try {
            const res = await api.get<PredictionRecord[]>("/predict/history")
            setPredictions(res.data)
        } catch {
            setPredictions([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { checkAuth() }, [checkAuth])
    useEffect(() => { queueMicrotask(() => { fetchHistory() }) }, [fetchHistory])
    useEffect(() => {
        const onFocus = () => { fetchHistory() }
        window.addEventListener("focus", onFocus)
        return () => window.removeEventListener("focus", onFocus)
    }, [fetchHistory])

    const stats = useMemo(() => {
        if (isDoctor) {
            const { total, benign, malignant, reports } = getDoctorClinicalStats(predictions)
            return [
                { label: "Assessments reviewed", value: total, icon: Activity },
                { label: "Benign model outputs", value: benign, icon: CheckCircle2 },
                { label: "Needs clinical review", value: malignant, icon: AlertCircle },
                { label: "Reports generated", value: reports, icon: FileText },
            ]
        }
        const { total, low, moderate, high } = getPatientRiskStats(predictions)
        return [
            { label: "Assessments completed", value: total, icon: Activity },
            { label: "Low risk results", value: low, icon: CheckCircle2 },
            { label: "Watch zone results", value: moderate, icon: AlertCircle },
            { label: "Review zone results", value: high, icon: AlertCircle },
        ]
    }, [isDoctor, predictions])

    const recentPredictions = predictions.slice(0, 4)
    const latest = predictions[0]

    const actions = [
        {
            label: isDoctor ? "Open clinical predictor" : "Start guided assessment",
            description: isDoctor ? "Enter Wisconsin diagnostic features in grouped panels." : "Answer patient questions and generate a report.",
            href: "/predict",
            icon: Activity,
        },
        {
            label: "Community questions",
            description: "Read and respond with context from patients and clinicians.",
            href: "/community",
            icon: MessageCircle,
        },
        ...(!isDoctor ? [{
            label: "Report history",
            description: "Download previous assessment reports for appointments.",
            href: "/reports",
            icon: FileText,
        }] : []),
    ]

    return (
        <div className="app-shell flex min-h-screen">
            <Sidebar />
            <main className="ml-72 flex-1 p-8">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="eyebrow">{isDoctor ? "Clinical overview" : "Your breast health workspace"}</p>
                            <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
                                {isDoctor ? "Review model activity and follow-up needs." : "Keep your assessments and reports ready for care."}
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                                {isDoctor
                                    ? "This view prioritizes recent outputs, report availability, and cases that may need review."
                                    : "This view keeps the next assessment, latest result, and downloadable reports in one place."}
                            </p>
                        </div>
                        <Link href="/predict" className="inline-flex items-center justify-center rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90">
                            {isDoctor ? "Run predictor" : "New assessment"}
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                    </header>

                    <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                        <div className="patient-surface rounded-lg p-5">
                            {loading ? (
                                <div className="flex h-48 items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-teal" />
                                </div>
                            ) : latest ? (
                                <RiskLens result={latest.prediction_result} score={latest.confidence} role={isDoctor ? "doctor" : "patient"} />
                            ) : (
                                <div className="rounded-lg border border-dashed border-teal/35 bg-scrub/55 p-8">
                                    <Activity className="h-6 w-6 text-teal" />
                                    <h2 className="mt-4 font-display text-3xl font-semibold text-ink">
                                        {isDoctor ? "No clinical outputs yet" : "No assessment on record yet"}
                                    </h2>
                                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                                        {isDoctor
                                            ? "Run the predictor to create the first model output and report."
                                            : "Start the guided assessment when you are ready. Your result will appear here with next steps."}
                                    </p>
                                    <Link href="/predict" className="mt-5 inline-flex rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white">
                                        {isDoctor ? "Open predictor" : "Start assessment"}
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {stats.map((stat) => (
                                <div key={stat.label} className="clinical-surface rounded-lg p-4">
                                    <stat.icon className="mb-4 h-4 w-4 text-slate-500" />
                                    <p className="text-3xl font-semibold tabular-nums text-ink">{loading ? "-" : stat.value}</p>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                        <div>
                            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Useful next actions</h2>
                            <div className="space-y-3">
                                {actions.map((action) => (
                                    <Link key={action.href} href={action.href} className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-teal/50">
                                        <action.icon className="mt-0.5 h-5 w-5 text-teal" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-ink">{action.label}</p>
                                            <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{action.description}</p>
                                        </div>
                                        <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                                    {isDoctor ? "Recent model outputs" : "Recent assessments"}
                                </h2>
                                {!isDoctor && predictions.length > 0 && <Link href="/reports" className="text-sm font-semibold text-teal hover:underline">All reports</Link>}
                            </div>
                            {loading ? (
                                <div className="clinical-surface flex h-40 items-center justify-center rounded-lg">
                                    <Loader2 className="h-6 w-6 animate-spin text-teal" />
                                </div>
                            ) : recentPredictions.length === 0 ? (
                                <div className="clinical-surface rounded-lg p-8">
                                    <FileText className="h-6 w-6 text-teal" />
                                    <h3 className="mt-4 font-display text-2xl font-semibold text-ink">Your timeline will build here.</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                        Results are saved after each completed assessment, along with report links when available.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentPredictions.map((pred) => (
                                        <div key={pred.id} className="rounded-lg border border-border bg-card p-4">
                                            <RiskLens result={pred.prediction_result} score={pred.confidence} role={isDoctor ? "doctor" : "patient"} compact />
                                            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                {timeAgo(pred.created_at)}
                                                {pred.report_pdf_url && <span className="font-semibold text-teal">Report available</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

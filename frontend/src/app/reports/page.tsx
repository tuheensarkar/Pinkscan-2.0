"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, Download, FileText, Loader2, Search } from "lucide-react"
import { api } from "@/lib/axios"
import { useAuthStore } from "@/stores/authStore"
import Sidebar from "@/components/Sidebar"
import { RiskLens } from "@/components/RiskLens"
import { getReportUrl } from "@/lib/reportUrl"
import {
    getPatientRiskStats,
    timeAgo,
    type PredictionRecord,
} from "@/lib/predictionStats"

export default function ReportsPage() {
    const { checkAuth } = useAuthStore()
    const [predictions, setPredictions] = useState<PredictionRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => { checkAuth() }, [checkAuth])

    const fetchReports = useCallback(async () => {
        try {
            const res = await api.get<PredictionRecord[]>("/predict/history")
            setPredictions(res.data)
            setError("")
        } catch (err: unknown) {
            const e = err as { response?: { status?: number } }
            if (e?.response?.status !== 404) {
                setError("Could not load report history.")
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { queueMicrotask(() => { fetchReports() }) }, [fetchReports])
    useEffect(() => {
        const onFocus = () => { fetchReports() }
        window.addEventListener("focus", onFocus)
        return () => window.removeEventListener("focus", onFocus)
    }, [fetchReports])

    const { total, low, moderate, high } = getPatientRiskStats(predictions)

    return (
        <div className="app-shell flex min-h-screen">
            <Sidebar />
            <main className="ml-72 flex-1 p-8">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-8">
                        <p className="eyebrow">Patient report library</p>
                        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Reports prepared for care visits</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                            Download your assessment PDFs and review how results have changed over time.
                        </p>
                    </header>

                    <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                        {[
                            ["All reports", total],
                            ["Low zone", low],
                            ["Watch zone", moderate],
                            ["Review zone", high],
                        ].map(([label, value]) => (
                            <div key={label} className="clinical-surface rounded-lg p-4">
                                <p className="text-3xl font-semibold tabular-nums text-ink">{loading ? "-" : value}</p>
                                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                            </div>
                        ))}
                    </section>

                    {loading ? (
                        <div className="clinical-surface flex h-64 items-center justify-center rounded-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-teal" />
                        </div>
                    ) : error ? (
                        <EmptyState title="Report history is unavailable" body="The app could not reach the history endpoint. Try again after confirming the backend is running." />
                    ) : predictions.length === 0 ? (
                        <EmptyState title="No reports yet" body="After your first guided assessment, the PDF report will appear here for download." />
                    ) : (
                        <div className="space-y-4">
                            {predictions.map((pred) => {
                                const reportUrl = getReportUrl(pred.report_pdf_url)
                                return (
                                    <article key={pred.id} className="patient-surface rounded-lg p-5">
                                        <div className="grid gap-5 lg:grid-cols-[1fr_12rem]">
                                            <RiskLens result={pred.prediction_result} score={pred.confidence} compact />
                                            <div className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Assessment</p>
                                                    <p className="mt-1 font-semibold tabular-nums text-ink">#{pred.id}</p>
                                                    <p className="mt-2 text-sm text-muted-foreground">{timeAgo(pred.created_at)}</p>
                                                </div>
                                                {reportUrl ? (
                                                    <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-teal/90">
                                                        <Download className="h-4 w-4" />PDF
                                                    </a>
                                                ) : (
                                                    <p className="text-xs font-semibold text-muted-foreground">No PDF saved</p>
                                                )}
                                            </div>
                                        </div>
                                        {pred.notes && (
                                            <p className="mt-4 rounded-md border border-border bg-paper/70 p-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{pred.notes}</p>
                                        )}
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

function EmptyState({ title, body }: { title: string; body: string }) {
    return (
        <div className="patient-surface rounded-lg p-10">
            <div className="max-w-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-teal/30 bg-scrub text-teal">
                    {title.includes("unavailable") ? <AlertCircle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <h2 className="mt-5 font-display text-3xl font-semibold text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{body}</p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground">
                    <Search className="h-4 w-4" />
                    Reports are saved after completed assessments
                </div>
            </div>
        </div>
    )
}

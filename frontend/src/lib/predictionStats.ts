export type PredictionRecord = {
    id: number
    prediction_result: string
    confidence: number
    notes: string | null
    report_pdf_url: string | null
    created_at: string
}

export function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return "just now"
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function getPatientRiskStats(predictions: PredictionRecord[]) {
    return {
        total: predictions.length,
        low: predictions.filter((p) => /low/i.test(p.prediction_result)).length,
        moderate: predictions.filter((p) => /moderate/i.test(p.prediction_result)).length,
        high: predictions.filter((p) => /high/i.test(p.prediction_result)).length,
        reports: predictions.filter((p) => p.report_pdf_url).length,
    }
}

export function getDoctorClinicalStats(predictions: PredictionRecord[]) {
    return {
        total: predictions.length,
        benign: predictions.filter((p) => p.prediction_result === "Benign").length,
        malignant: predictions.filter((p) => p.prediction_result === "Malignant").length,
        reports: predictions.filter((p) => p.report_pdf_url).length,
    }
}

const toneStyles = {
    positive: {
        badge: "text-pink-600 bg-pink-50 dark:bg-pink-950/30",
        border: "border-pink-100 dark:border-pink-900",
    },
    warning: {
        badge: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-100 dark:border-amber-900",
    },
    critical: {
        badge: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
        border: "border-rose-100 dark:border-rose-900",
    },
    neutral: {
        badge: "text-slate-600 bg-slate-50 dark:bg-slate-800",
        border: "border-border",
    },
} as const

export function getResultPresentation(result: string, role?: string) {
    let tone: keyof typeof toneStyles = "neutral"

    if (role === "doctor") {
        if (result === "Benign") tone = "positive"
        else if (result === "Malignant") tone = "critical"
    } else {
        if (/high/i.test(result)) tone = "critical"
        else if (/moderate/i.test(result)) tone = "warning"
        else if (/low/i.test(result)) tone = "positive"
    }

    return { tone, label: result, ...toneStyles[tone] }
}

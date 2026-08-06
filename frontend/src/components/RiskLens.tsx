import { cn } from "@/lib/utils"

type Tone = "low" | "moderate" | "high" | "neutral"

type RiskLensProps = {
    result: string
    score?: number
    compact?: boolean
    role?: "patient" | "doctor" | string
    className?: string
}

function toneFor(result: string, role?: string): Tone {
    if (role === "doctor") {
        if (/benign/i.test(result)) return "low"
        if (/malignant/i.test(result)) return "high"
    }
    if (/low|benign/i.test(result)) return "low"
    if (/moderate/i.test(result)) return "moderate"
    if (/high|malignant/i.test(result)) return "high"
    return "neutral"
}

function guidanceFor(tone: Tone, role?: string) {
    if (role === "doctor") {
        if (tone === "low") return "Model output indicates a lower concern pattern. Correlate with clinical context."
        if (tone === "high") return "Prioritize clinical review and confirm with appropriate diagnostic workflow."
        return "Review model output with the full patient record."
    }
    if (tone === "low") return "Routine screening conversation"
    if (tone === "moderate") return "Discuss personal risk factors"
    if (tone === "high") return "Prompt clinical review recommended"
    return "Review assessment details"
}

const toneClass = {
    low: {
        text: "text-[#F62477]",
        border: "border-[#FBCFE8]",
        bg: "bg-[#FDF2F8]",
        marker: "bg-[#F62477]",
        markerLeft: "left-[16%]",
    },
    moderate: {
        text: "text-clay",
        border: "border-[#e1c991]",
        bg: "bg-[#fff8e8]",
        marker: "bg-clay",
        markerLeft: "left-1/2",
    },
    high: {
        text: "text-rose-med",
        border: "border-[#e4b2c1]",
        bg: "bg-[#fff1f4]",
        marker: "bg-rose-med",
        markerLeft: "left-[84%]",
    },
    neutral: {
        text: "text-slate-600",
        border: "border-border",
        bg: "bg-slate-50",
        marker: "bg-slate-500",
        markerLeft: "left-1/2",
    },
}

export function RiskLens({ result, score, compact = false, role, className }: RiskLensProps) {
    const tone = toneFor(result, role)
    const styles = toneClass[tone]
    const markerPosition = typeof score === "number" ? `${Math.min(Math.max(score, 2), 98)}%` : undefined

    return (
        <div className={cn("rounded-lg border p-4", styles.border, styles.bg, className)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="eyebrow">Risk lens</p>
                    <div className={cn("font-display text-2xl font-semibold leading-tight", styles.text)}>
                        {result}
                    </div>
                    {!compact && (
                        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-700 dark:text-slate-200">
                            {guidanceFor(tone, role)}
                        </p>
                    )}
                </div>
                {typeof score === "number" && (
                    <div className="text-left sm:text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {role === "doctor" ? "Confidence" : "Score"}
                        </p>
                        <p className="text-2xl font-semibold tabular-nums text-ink">{score.toFixed(role === "doctor" ? 1 : 0)}%</p>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <div className="relative h-3 overflow-hidden rounded-full bg-white ring-1 ring-black/5">
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-[#F62477]" />
                    <div className="absolute inset-y-0 left-1/3 w-1/3 bg-clay" />
                    <div className="absolute inset-y-0 left-2/3 w-1/3 bg-rose-med" />
                    <div
                        className={cn("absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white", styles.marker, markerPosition ? "" : styles.markerLeft)}
                        style={markerPosition ? { left: markerPosition } : undefined}
                    />
                </div>
                {!compact && (
                    <div className="mt-2 grid grid-cols-3 text-[0.68rem] font-semibold uppercase tracking-wide text-slate-500">
                        <span>Low</span>
                        <span className="text-center">Watch</span>
                        <span className="text-right">Review</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export function riskTone(result: string, role?: string) {
    return toneFor(result, role)
}

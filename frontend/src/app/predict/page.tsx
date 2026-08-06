"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, AlertCircle, CheckCircle2, Download, Info, Loader2, Sparkles } from "lucide-react"
import { api } from "@/lib/axios"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/Sidebar"
import { RiskLens } from "@/components/RiskLens"
import { getReportUrl } from "@/lib/reportUrl"

type PatientFormState = {
    age: string
    height: string
    weight: string
    gender: string
    familyHistory: string
    brcaMutation: string
    previousBiopsy: string
    previousCancer: string
    denseBreastTissue: string
    firstMenstruationAge: string
    firstChildbirthAge: string
    menopauseStatus: string
    hormoneTherapy: string
    smoking: string
    alcohol: string
    physicalActivity: string
    diet: string
    breastLump: boolean
    breastPain: boolean
    nippleDischarge: boolean
    skinDimpling: boolean
    breastSizeChange: boolean
    swollenLymph: boolean
}

type PatientResult = {
    level: "Low" | "Moderate" | "High"
    score: number
    factors: string[]
    recommendations: string[]
    ai_recommendations?: string | null
    disclaimer: string
    report_pdf_url?: string | null
}

type DoctorResult = {
    prediction_result: string
    confidence: number
    id: number
    report_pdf_url?: string | null
}

const patientInitialForm: PatientFormState = {
    age: "",
    height: "",
    weight: "",
    gender: "",
    familyHistory: "unknown",
    brcaMutation: "unknown",
    previousBiopsy: "unknown",
    previousCancer: "unknown",
    denseBreastTissue: "unknown",
    firstMenstruationAge: "",
    firstChildbirthAge: "",
    menopauseStatus: "unknown",
    hormoneTherapy: "unknown",
    smoking: "no",
    alcohol: "none",
    physicalActivity: "moderate",
    diet: "balanced",
    breastLump: false,
    breastPain: false,
    nippleDischarge: false,
    skinDimpling: false,
    breastSizeChange: false,
    swollenLymph: false,
}

const yesNoUnknown = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "unknown", label: "Unknown" },
]

const patientSteps = [
    { title: "Basics", note: "Age and body measurements help place risk in context." },
    { title: "History", note: "Family, genetic, and previous breast health history carry more weight." },
    { title: "Life stage", note: "Hormonal and reproductive history can affect screening conversations." },
    { title: "Lifestyle", note: "These factors are modifiable and useful for prevention planning." },
    { title: "Symptoms", note: "Current symptoms should be discussed promptly with a clinician." },
]

const featureLabels = [
    "Mean Radius", "Mean Texture", "Mean Perimeter", "Mean Area", "Mean Smoothness",
    "Mean Compactness", "Mean Concavity", "Mean Concave Points", "Mean Symmetry", "Mean Fractal Dimension",
    "Radius SE", "Texture SE", "Perimeter SE", "Area SE", "Smoothness SE",
    "Compactness SE", "Concavity SE", "Concave Points SE", "Symmetry SE", "Fractal Dimension SE",
    "Worst Radius", "Worst Texture", "Worst Perimeter", "Worst Area", "Worst Smoothness",
    "Worst Compactness", "Worst Concavity", "Worst Concave Points", "Worst Symmetry", "Worst Fractal Dimension",
]

const defaultWisconsinValues = [
    17.99, 10.38, 122.8, 1001, 0.1184, 0.2776, 0.3001, 0.1471, 0.2419, 0.07871,
    1.095, 0.9053, 8.589, 153.4, 0.006399, 0.04904, 0.05373, 0.01587, 0.03003, 0.006193,
    25.38, 17.33, 184.6, 2019, 0.1622, 0.6656, 0.7119, 0.2654, 0.4601, 0.1189,
]

function toNumber(value: string) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

function calculateBmi(heightCm: string, weightKg: string) {
    const height = toNumber(heightCm) / 100
    const weight = toNumber(weightKg)
    if (!height || !weight) return null
    return weight / (height * height)
}

export default function PredictPage() {
    const { user, checkAuth } = useAuthStore()
    useEffect(() => { checkAuth() }, [checkAuth])

    return (
        <div className="app-shell flex min-h-screen">
            <Sidebar />
            <main className="ml-72 flex-1 p-8">
                <div className="mx-auto max-w-6xl">
                    {user?.role === "doctor" ? <DoctorWisconsinForm /> : <PatientSelfAssessment />}
                </div>
            </main>
        </div>
    )
}

function PatientSelfAssessment() {
    const [form, setForm] = useState<PatientFormState>(patientInitialForm)
    const [result, setResult] = useState<PatientResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [step, setStep] = useState(0)
    const bmi = useMemo(() => calculateBmi(form.height, form.weight), [form.height, form.weight])
    const reportUrl = getReportUrl(result?.report_pdf_url)

    const updateField = (field: keyof PatientFormState, value: string | boolean) => {
        setForm(current => ({ ...current, [field]: value }))
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError("")
        setResult(null)
        try {
            const res = await api.post("/predict/self-assessment", { responses: form })
            setResult(res.data)
        } catch (err: unknown) {
            const e = err as { response?: { data?: { detail?: string } } }
            setError(e?.response?.data?.detail || "Could not generate assessment report.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <header className="mb-8">
                <p className="eyebrow">Patient pathway</p>
                <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Guided breast health assessment</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                    Move through each section at your own pace. The report is designed for a care conversation, not for self-diagnosis.
                </p>
            </header>

            <div className="mb-6 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm leading-6 text-slate-800">
                <div className="flex gap-3">
                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal" />
                    <p>If you currently have a new lump, nipple discharge, skin dimpling, swelling, or persistent pain, please contact a healthcare professional promptly.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[15rem_1fr]">
                <aside className="patient-surface h-fit rounded-lg p-3">
                    {patientSteps.map((item, index) => (
                        <button
                            key={item.title}
                            type="button"
                            onClick={() => setStep(index)}
                            className={`w-full rounded-md p-3 text-left transition-colors ${step === index ? "bg-teal text-white" : "hover:bg-scrub"}`}
                        >
                            <p className="text-xs font-bold uppercase tracking-wide">Step {index + 1}</p>
                            <p className="mt-1 font-semibold">{item.title}</p>
                        </button>
                    ))}
                </aside>

                <div className="space-y-6">
                    <section className="patient-surface rounded-lg p-6">
                        <p className="eyebrow">{patientSteps[step].title}</p>
                        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">{patientSteps[step].note}</h2>
                        <div className="mt-6">{renderPatientStep(step, form, updateField, bmi)}</div>
                    </section>

                    <div className="flex flex-wrap gap-3">
                        {step > 0 && <Button type="button" variant="outline" onClick={() => setStep(current => current - 1)}>Previous</Button>}
                        {step < patientSteps.length - 1 ? (
                            <Button type="button" className="bg-teal text-white hover:bg-teal/90" onClick={() => setStep(current => current + 1)}>Continue</Button>
                        ) : (
                            <Button type="submit" disabled={loading} className="bg-teal text-white hover:bg-teal/90">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate report
                            </Button>
                        )}
                        <Button type="button" variant="ghost" onClick={() => { setForm(patientInitialForm); setResult(null); setError(""); setStep(0) }}>Reset</Button>
                    </div>
                </div>
            </form>

            {error && <ErrorMessage message={error} />}

            {result && (
                <section className="mt-8 patient-surface rounded-lg p-6">
                    <RiskLens result={`${result.level} Risk`} score={result.score} />
                    <div className="mt-6 grid gap-5 lg:grid-cols-2">
                        <ResultList title="Factors used in this score" items={result.factors} />
                        <ResultList title="Recommended next steps" items={result.recommendations} />
                    </div>
                    {result.ai_recommendations && (
                        <div className="mt-5 rounded-lg border border-border bg-card p-5">
                            <h4 className="font-semibold text-ink">Additional guidance</h4>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{result.ai_recommendations}</p>
                        </div>
                    )}
                    <p className="mt-5 text-sm leading-6 text-muted-foreground">{result.disclaimer}</p>
                    {reportUrl && (
                        <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90">
                            <Download className="h-4 w-4" />Download PDF report
                        </a>
                    )}
                </section>
            )}
        </>
    )
}

function renderPatientStep(step: number, form: PatientFormState, updateField: (field: keyof PatientFormState, value: string | boolean) => void, bmi: number | null) {
    if (step === 0) {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field label="Age" type="number" value={form.age} onChange={value => updateField("age", value)} required prominent />
                <Field label="Height (cm)" type="number" value={form.height} onChange={value => updateField("height", value)} />
                <Field label="Weight (kg)" type="number" value={form.weight} onChange={value => updateField("weight", value)} />
                <SelectField label="Gender" value={form.gender} onChange={value => updateField("gender", value)} options={[
                    { value: "", label: "Select" },
                    { value: "female", label: "Female" },
                    { value: "male", label: "Male" },
                    { value: "other", label: "Other" },
                ]} />
                {bmi && <div className="rounded-md border border-teal/25 bg-scrub p-3 md:col-span-4"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Calculated BMI</p><p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{bmi.toFixed(1)}</p></div>}
            </div>
        )
    }
    if (step === 1) {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <SelectField label="Family history of breast cancer?" value={form.familyHistory} onChange={value => updateField("familyHistory", value)} options={yesNoUnknown} prominent />
                <SelectField label="BRCA1/BRCA2 mutation?" value={form.brcaMutation} onChange={value => updateField("brcaMutation", value)} options={yesNoUnknown} prominent />
                <SelectField label="Previous breast biopsy?" value={form.previousBiopsy} onChange={value => updateField("previousBiopsy", value)} options={yesNoUnknown} />
                <SelectField label="Previous breast cancer?" value={form.previousCancer} onChange={value => updateField("previousCancer", value)} options={yesNoUnknown} prominent />
                <SelectField label="Dense breast tissue?" value={form.denseBreastTissue} onChange={value => updateField("denseBreastTissue", value)} options={yesNoUnknown} />
            </div>
        )
    }
    if (step === 2) {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Age at first menstruation" type="number" value={form.firstMenstruationAge} onChange={value => updateField("firstMenstruationAge", value)} />
                <Field label="Age at first childbirth" type="text" value={form.firstChildbirthAge} onChange={value => updateField("firstChildbirthAge", value)} placeholder='Use "none" if not applicable' />
                <SelectField label="Menopause status" value={form.menopauseStatus} onChange={value => updateField("menopauseStatus", value)} options={[
                    { value: "unknown", label: "Unknown" },
                    { value: "pre", label: "Pre-menopause" },
                    { value: "peri", label: "Perimenopause" },
                    { value: "post", label: "Post-menopause" },
                ]} />
                <SelectField label="Hormone replacement therapy?" value={form.hormoneTherapy} onChange={value => updateField("hormoneTherapy", value)} options={yesNoUnknown} />
            </div>
        )
    }
    if (step === 3) {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SelectField label="Smoking" value={form.smoking} onChange={value => updateField("smoking", value)} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
                <SelectField label="Alcohol consumption" value={form.alcohol} onChange={value => updateField("alcohol", value)} options={[{ value: "none", label: "None" }, { value: "occasional", label: "Occasional" }, { value: "regular", label: "Regular" }]} />
                <SelectField label="Physical activity" value={form.physicalActivity} onChange={value => updateField("physicalActivity", value)} options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
                <SelectField label="Diet" value={form.diet} onChange={value => updateField("diet", value)} options={[{ value: "balanced", label: "Balanced" }, { value: "mixed", label: "Mixed" }, { value: "poor", label: "Poor" }]} />
            </div>
        )
    }
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CheckboxField label="Breast lump" checked={form.breastLump} onChange={value => updateField("breastLump", value)} urgent />
            <CheckboxField label="Nipple discharge" checked={form.nippleDischarge} onChange={value => updateField("nippleDischarge", value)} urgent />
            <CheckboxField label="Skin dimpling" checked={form.skinDimpling} onChange={value => updateField("skinDimpling", value)} urgent />
            <CheckboxField label="Breast pain" checked={form.breastPain} onChange={value => updateField("breastPain", value)} />
            <CheckboxField label="Change in breast size or shape" checked={form.breastSizeChange} onChange={value => updateField("breastSizeChange", value)} />
            <CheckboxField label="Swollen lymph nodes" checked={form.swollenLymph} onChange={value => updateField("swollenLymph", value)} />
        </div>
    )
}

function DoctorWisconsinForm() {
    const [features, setFeatures] = useState<number[]>(defaultWisconsinValues)
    const [notes, setNotes] = useState("")
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [result, setResult] = useState<DoctorResult | null>(null)
    const reportUrl = getReportUrl(result?.report_pdf_url)
    const groups = [
        { label: "Mean", description: "Primary cell nucleus measurements", range: [0, 10] },
        { label: "Standard error", description: "Measurement variation and uncertainty", range: [10, 20] },
        { label: "Worst", description: "Largest or most concerning observed values", range: [20, 30] },
    ]

    const updateFeature = (index: number, value: string) => {
        const next = [...features]
        next[index] = parseFloat(value) || 0
        setFeatures(next)
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError("")
        setResult(null)
        try {
            const res = await api.post("/predict/", { features, notes })
            setResult(res.data)
        } catch (err: unknown) {
            const e = err as { response?: { data?: { detail?: string } } }
            setError(e?.response?.data?.detail || "Prediction failed. Make sure the ML model is trained.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <header className="mb-8">
                <p className="eyebrow">Clinical workspace</p>
                <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Wisconsin diagnostic model</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                    Feature entry is grouped by measurement type for faster review. Sample values remain pre-filled for testing.
                </p>
            </header>

            <div className="data-panel mb-6 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 text-teal" />
                    <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">This model output supports clinical review. It should be interpreted with imaging, pathology, patient history, and local protocol.</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
                <aside className="clinical-surface h-fit rounded-lg p-3">
                    {groups.map((group, index) => (
                        <button key={group.label} onClick={() => setStep(index)} className={`w-full rounded-md p-3 text-left transition-colors ${step === index ? "bg-teal text-white" : "hover:bg-scrub"}`}>
                            <p className="text-sm font-bold">{group.label}</p>
                            <p className={`mt-1 text-xs leading-5 ${step === index ? "text-white/80" : "text-muted-foreground"}`}>{group.description}</p>
                        </button>
                    ))}
                </aside>

                <div className="space-y-6">
                    <section className="clinical-surface rounded-lg p-5">
                        <div className="mb-5 flex items-end justify-between">
                            <div>
                                <p className="eyebrow">Feature group</p>
                                <h2 className="mt-1 text-2xl font-semibold text-ink">{groups[step].label} features</h2>
                            </div>
                            <p className="text-sm font-semibold tabular-nums text-muted-foreground">{groups[step].range[0] + 1}-{groups[step].range[1]} / 30</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                            {features.slice(groups[step].range[0], groups[step].range[1]).map((value, relativeIndex) => {
                                const absoluteIndex = groups[step].range[0] + relativeIndex
                                return (
                                    <Field key={featureLabels[absoluteIndex]} label={featureLabels[absoluteIndex]} type="number" value={String(value)} onChange={next => updateFeature(absoluteIndex, next)} compact />
                                )
                            })}
                        </div>
                    </section>

                    <section className="clinical-surface rounded-lg p-5">
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-ink">Clinical notes for report</span>
                            <textarea rows={4} value={notes} onChange={event => setNotes(event.target.value)} className="form-field w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/35" />
                        </label>
                        <div className="mt-4 flex gap-3">
                            {step > 0 && <Button variant="outline" onClick={() => setStep(current => current - 1)}>Previous</Button>}
                            {step < 2 ? (
                                <Button className="bg-teal text-white hover:bg-teal/90" onClick={() => setStep(current => current + 1)}>Next group</Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={loading} className="bg-teal text-white hover:bg-teal/90">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
                                    Run prediction
                                </Button>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {error && <ErrorMessage message={error} />}
            {result && (
                <section className="mt-8 clinical-surface rounded-lg p-6">
                    <RiskLens result={result.prediction_result} score={result.confidence} role="doctor" />
                    {reportUrl && <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90"><Download className="h-4 w-4" />Download report</a>}
                </section>
            )}
        </>
    )
}

function Field({ label, value, onChange, type, placeholder, required = false, prominent = false, compact = false }: {
    label: string
    value: string
    onChange: (value: string) => void
    type: string
    placeholder?: string
    required?: boolean
    prominent?: boolean
    compact?: boolean
}) {
    return (
        <label className={`block rounded-md ${prominent ? "border border-teal/25 bg-scrub p-3" : ""}`}>
            <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
            <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} required={required} className={`form-field w-full rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal/35 ${compact ? "py-1.5 tabular-nums" : "py-2"}`} />
        </label>
    )
}

function SelectField({ label, value, onChange, options, prominent = false }: {
    label: string
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    prominent?: boolean
}) {
    return (
        <label className={`block rounded-md ${prominent ? "border border-teal/25 bg-scrub p-3" : ""}`}>
            <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
            <select value={value} onChange={event => onChange(event.target.value)} className="form-field w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/35">
                {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        </label>
    )
}

function CheckboxField({ label, checked, onChange, urgent = false }: {
    label: string
    checked: boolean
    onChange: (value: boolean) => void
    urgent?: boolean
}) {
    return (
        <label className={`flex min-h-14 items-center gap-3 rounded-md border px-3 py-2 text-sm font-medium ${urgent ? "border-[#e4b2c1] bg-[#fff1f4] text-ink" : "border-border bg-card"}`}>
            <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="h-4 w-4 rounded border-input accent-teal" />
            <span>{label}</span>
        </label>
    )
}

function ResultList({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="rounded-lg border border-border bg-card p-5">
            <h4 className="font-semibold text-ink">{title}</h4>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {items.map(item => (
                    <li key={item} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="my-6 flex gap-3 rounded-lg border border-[#e4b2c1] bg-[#fff1f4] p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-med" />
            <p className="text-sm font-medium text-rose-med">{message}</p>
        </div>
    )
}

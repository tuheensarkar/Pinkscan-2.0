"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Activity, AlertTriangle, CheckCircle2, ExternalLink, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/axios"

type RegisterState = {
    email: string
    isVerified: boolean
    verificationLink?: string
    emailWarning?: string
}

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: "", password: "", full_name: "", role: "patient"
    })
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState("")
    const [result, setResult] = useState<RegisterState | null>(null)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            const { data } = await api.post("/auth/register", formData)
            setResult({
                email: data.email,
                isVerified: !!data.is_verified,
                verificationLink: data.verification_link,
                emailWarning: data.email_warning,
            })
        } catch (err: unknown) {
            let msg = "An error occurred during registration."
            if (err && typeof err === "object" && "response" in err) {
                const resp = (err as { response?: { data?: { detail?: string } } }).response
                msg = resp?.data?.detail || msg
            }
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (!result) return
        setResending(true)
        setError("")
        try {
            const { data } = await api.post(
                `/auth/resend-verification?email=${encodeURIComponent(result.email)}`,
            )
            if (data.verification_link) {
                setResult({ ...result, verificationLink: data.verification_link })
            }
            if (data.email_error_detail) {
                setResult(prev => prev ? { ...prev, emailWarning: data.detail } : prev)
            }
        } catch {
            // Silent success to avoid leaking user existence
        } finally {
            setResending(false)
        }
    }

    if (result?.isVerified && !result.verificationLink) {
        // Auto-verified fallback: user can sign in immediately, optionally with a warning.
        return (
            <div className="flex min-h-screen items-center justify-center bg-paper p-4 py-12">
                <div className="patient-surface w-full max-w-md rounded-lg p-8">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-teal/30 bg-scrub text-teal">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <h1 className="font-display text-3xl font-semibold text-ink">Account created</h1>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Your account is ready. Sign in to continue to the PinkScan workspace.
                        </p>
                        {result.emailWarning && (
                            <div className="mt-5 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-left text-sm leading-6 text-amber-900">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                <div>
                                    <p className="font-semibold">Verification email couldn&apos;t be delivered</p>
                                    <p className="mt-1 text-xs leading-5 text-amber-800">
                                        {result.emailWarning}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-7 space-y-3">
                        <Link href="/auth/login">
                            <Button className="h-11 w-full rounded-md bg-teal text-white hover:bg-teal/90">
                                Sign in now
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (result) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-paper p-4 py-12">
                <div className="patient-surface w-full max-w-md rounded-lg p-8">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-teal/30 bg-scrub text-teal">
                            <Mail className="h-6 w-6" />
                        </div>
                        <h1 className="font-display text-3xl font-semibold text-ink">Check your inbox</h1>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            We&apos;ve sent a verification email to{" "}
                            <span className="font-semibold text-ink">{result.email}</span>.
                            Click the link in the email to verify your address before signing in.
                        </p>
                        {result.verificationLink && (
                            <div className="mt-5 rounded-md border border-border bg-card p-4 text-left text-xs leading-5 text-muted-foreground">
                                <p className="mb-2 font-semibold text-ink">Development shortcut</p>
                                <a
                                    href={result.verificationLink}
                                    className="inline-flex items-center gap-1 break-all rounded bg-[#fdf2f8] px-2 py-1 font-medium text-teal hover:underline"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    Open verification link <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}
                    </div>
                    <div className="mt-7 space-y-3">
                        <Button
                            onClick={handleResend}
                            variant="outline"
                            className="h-11 w-full rounded-md bg-card"
                            disabled={resending}
                        >
                            {resending ? "Resending..." : "Resend verification email"}
                        </Button>
                        <Link href="/auth/login">
                            <Button variant="ghost" className="h-11 w-full rounded-md font-semibold text-teal">
                                Go to sign in
                            </Button>
                        </Link>
                    </div>
                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                        Didn&apos;t get the email? Check your spam folder before resending.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-paper p-4 py-12">
            <div className="patient-surface w-full max-w-md rounded-lg p-8">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-teal/30 bg-scrub overflow-hidden">
                        <Image src="/logo.png" alt="PinkScan Logo" width={44} height={44} className="object-cover" />
                    </div>
                    <h1 className="font-display text-3xl font-semibold text-ink">Create your PinkScan account</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Choose a patient or doctor workspace.</p>
                </div>
                <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                    {error && <div className="rounded-md border border-[#e4b2c1] bg-[#fff1f4] p-3 text-sm font-medium text-rose-med">{error}</div>}
                    <Field label="Full name" type="text" value={formData.full_name} onChange={value => setFormData({ ...formData, full_name: value })} placeholder="Full name" />
                    <Field label="Email address" type="email" value={formData.email} onChange={value => setFormData({ ...formData, email: value })} placeholder="name@example.com" />
                    <Field label="Password" type="password" value={formData.password} onChange={value => setFormData({ ...formData, password: value })} placeholder="Password" />
                    <label className="block">
                        <span className="mb-1 block text-sm font-semibold text-ink">Workspace type</span>
                        <select value={formData.role} onChange={event => setFormData({ ...formData, role: event.target.value })} className="form-field w-full rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/35">
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                        </select>
                    </label>
                    <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal/90" disabled={loading}>
                        {loading ? "Creating..." : "Create account"}
                    </Button>
                    <p className="text-center text-sm">
                        Already have an account? <Link href="/auth/login" className="font-semibold text-teal hover:underline">Log in</Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

function Field({ label, type, value, onChange, placeholder }: {
    label: string
    type: string
    value: string
    onChange: (value: string) => void
    placeholder: string
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
            <input type={type} required value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="form-field w-full rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/35" />
        </label>
    )
}

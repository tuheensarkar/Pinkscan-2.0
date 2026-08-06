"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Activity, Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/axios"
import { useAuthStore } from "@/stores/authStore"

function decodeJwtPayload(token: string) {
    const payloadBase64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    const paddedPayload = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, "=")
    return JSON.parse(atob(paddedPayload))
}

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState("")
    const [unverified, setUnverified] = useState<string | null>(null)
    const login = useAuthStore(state => state.login)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setUnverified(null)
        try {
            const form = new URLSearchParams()
            form.append("username", email)
            form.append("password", password)
            const res = await api.post("/auth/login", form)
            const token = res.data.access_token
            const payload = decodeJwtPayload(token)
            login(token, {
                id: payload.id,
                email: payload.sub,
                role: payload.role || "patient",
                full_name: payload.full_name || payload.sub,
            })
            router.push(payload.role === "patient" ? "/predict" : "/dashboard")
        } catch (err: unknown) {
            let msg = "An error occurred during login."
            let statusCode: number | null = null
            if (err && typeof err === "object" && "response" in err) {
                const resp = (err as { response?: { status?: number; data?: { detail?: string } } }).response
                statusCode = resp?.status ?? null
                msg = resp?.data?.detail || msg
            }
            if (statusCode === 403 && email) {
                setUnverified(email)
            } else {
                setError(msg)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        const target = unverified || email
        if (!target) return
        setResending(true)
        setError("")
        try {
            await api.post(`/auth/resend-verification?email=${encodeURIComponent(target)}`)
            setError("")
        } catch {
            // Silent success
        } finally {
            setResending(false)
        }
    }

    if (unverified) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-paper p-4">
                <div className="patient-surface w-full max-w-md rounded-lg p-8">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-teal/30 bg-scrub text-teal">
                            <Mail className="h-5 w-5" />
                        </div>
                        <h1 className="font-display text-3xl font-semibold text-ink">Verify your email</h1>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            The account <span className="font-semibold text-ink">{unverified}</span> has not been verified yet.
                            Check your inbox for the verification link we sent when you signed up.
                        </p>
                    </div>
                    <div className="mt-7 space-y-3">
                        <Button
                            onClick={handleResend}
                            variant="outline"
                            className="h-11 w-full rounded-md bg-card"
                            disabled={resending}
                        >
                            {resending ? (
                                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Resending...</>
                            ) : (
                                <><RefreshCw className="mr-2 h-4 w-4" /> Resend verification email</>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-11 w-full rounded-md font-semibold text-teal"
                            onClick={() => { setUnverified(null); setError("") }}
                        >
                            Back to sign in
                        </Button>
                    </div>
                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        Be sure to check your spam or junk folder if you don&apos;t see it within a few minutes.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-paper p-4">
            <div className="patient-surface w-full max-w-md rounded-lg p-8">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-teal/30 bg-scrub text-teal">
                        <Activity className="h-5 w-5" />
                    </div>
                    <h1 className="font-display text-3xl font-semibold text-ink">Continue your care workspace</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Sign in to access assessments and reports.</p>
                </div>
                <form className="mt-8 space-y-5" onSubmit={handleLogin}>
                    {error && <div className="rounded-md border border-[#e4b2c1] bg-[#fff1f4] p-3 text-sm font-medium text-rose-med">{error}</div>}
                    <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="doctor@pinkscan.com" />
                    <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Password" />
                    <div className="text-right text-sm">
                        <Link href="/auth/forgot-password" className="font-semibold text-teal hover:underline">Forgot password?</Link>
                    </div>
                    <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal/90" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </Button>
                    <p className="text-center text-sm">
                        New to PinkScan? <Link href="/auth/register" className="font-semibold text-teal hover:underline">Create an account</Link>
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

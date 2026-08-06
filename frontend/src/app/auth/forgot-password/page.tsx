"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/axios"

type Step = "email" | "otp" | "done"

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<Step>("email")
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")

    const requestOtp = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError("")
        setMessage("")
        try {
            const { data } = await api.post("/auth/forgot-password", { email })
            setMessage(data.email_warning || data.detail || "Check your inbox for the OTP.")
            setStep("otp")
        } catch (err: unknown) {
            let msg = "We couldn't send the password reset OTP."
            if (err && typeof err === "object" && "response" in err) {
                const resp = (err as { response?: { data?: { detail?: string } } }).response
                msg = resp?.data?.detail || msg
            }
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const resetPassword = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError("")
        try {
            await api.post("/auth/reset-password", {
                email,
                otp,
                password,
                confirm_password: confirmPassword,
            })
            setStep("done")
        } catch (err: unknown) {
            let msg = "We couldn't reset your password."
            if (err && typeof err === "object" && "response" in err) {
                const resp = (err as { response?: { data?: { detail?: string } } }).response
                msg = resp?.data?.detail || msg
            }
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    if (step === "done") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-paper p-4">
                <div className="patient-surface w-full max-w-md rounded-lg p-8">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-teal/30 bg-scrub text-teal">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <h1 className="font-display text-3xl font-semibold text-ink">Password updated</h1>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Your password has been reset. Sign in with your new password to continue.
                        </p>
                    </div>
                    <div className="mt-7">
                        <Link href="/auth/login">
                            <Button className="h-11 w-full rounded-md bg-teal text-white hover:bg-teal/90">
                                Go to sign in
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-paper p-4 py-12">
            <div className="patient-surface w-full max-w-md rounded-lg p-8">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-teal/30 bg-scrub text-teal">
                        {step === "email" ? <KeyRound className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                    </div>
                    <h1 className="font-display text-3xl font-semibold text-ink">
                        {step === "email" ? "Reset your password" : "Confirm with OTP"}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {step === "email"
                            ? "Enter your account email and we'll send a one-time password."
                            : `Enter the OTP sent to ${email}, then choose a new password.`}
                    </p>
                </div>

                {step === "email" ? (
                    <form className="mt-8 space-y-5" onSubmit={requestOtp}>
                        {error && <Notice tone="error" text={error} />}
                        <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="name@example.com" />
                        <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal/90" disabled={loading}>
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </Button>
                        <p className="text-center text-sm">
                            Remembered it? <Link href="/auth/login" className="font-semibold text-teal hover:underline">Sign in</Link>
                        </p>
                    </form>
                ) : (
                    <form className="mt-8 space-y-5" onSubmit={resetPassword}>
                        {message && (
                            <div className="flex items-start gap-3 rounded-md border border-teal/20 bg-scrub p-3 text-sm leading-6 text-ink">
                                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                                <span>{message}</span>
                            </div>
                        )}
                        {error && <Notice tone="error" text={error} />}
                        <Field label="OTP" type="text" value={otp} onChange={value => setOtp(value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit OTP" inputMode="numeric" />
                        <Field label="New password" type="password" value={password} onChange={setPassword} placeholder="New password" />
                        <Field label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password" />
                        <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal/90" disabled={loading}>
                            {loading ? "Resetting..." : "Reset password"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-11 w-full rounded-md font-semibold text-teal"
                            onClick={() => { setStep("email"); setError(""); setMessage("") }}
                        >
                            Use a different email
                        </Button>
                    </form>
                )}
            </div>
        </div>
    )
}

function Notice({ text }: { tone: "error"; text: string }) {
    return <div className="rounded-md border border-[#e4b2c1] bg-[#fff1f4] p-3 text-sm font-medium text-rose-med">{text}</div>
}

function Field({ label, type, value, onChange, placeholder, inputMode }: {
    label: string
    type: string
    value: string
    onChange: (value: string) => void
    placeholder: string
    inputMode?: "numeric"
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
            <input
                type={type}
                required
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                inputMode={inputMode}
                className="form-field w-full rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/35"
            />
        </label>
    )
}

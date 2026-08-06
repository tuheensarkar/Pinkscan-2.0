"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Activity, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/axios"

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token") || ""
    const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error")
    const [error, setError] = useState<string>(token ? "" : "Missing verification token. Please use the link from your email.")

    useEffect(() => {
        if (!token) {
            return
        }
        let cancelled = false
        async function verify() {
            try {
                const res = await api.post(`/auth/verify-email?token=${encodeURIComponent(token)}`)
                if (!cancelled) {
                    setStatus("success")
                    setError("")
                    setTimeout(() => router.push("/auth/login"), 2200)
                }
                void res
            } catch (err: unknown) {
                if (cancelled) return
                let msg = "We couldn't verify your email. The link may be expired or already used."
                if (err && typeof err === "object" && "response" in err) {
                    const resp = (err as { response?: { data?: { detail?: string } } }).response
                    msg = resp?.data?.detail || msg
                }
                setStatus("error")
                setError(msg)
            }
        }
        void verify()
        return () => { cancelled = true }
    }, [token, router])

    return (
        <div className="flex min-h-screen items-center justify-center bg-paper p-4">
            <div className="patient-surface w-full max-w-md rounded-lg p-8">
                <div className="text-center">
                    <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border ${status === "success" ? "border-teal/30 bg-scrub text-teal" : status === "error" ? "border-rose-med/30 bg-[#fff1f4] text-rose-med" : "border-border bg-card text-muted-foreground"}`}>
                        {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
                        {status === "success" && <CheckCircle2 className="h-6 w-6" />}
                        {status === "error" && <AlertTriangle className="h-6 w-6" />}
                    </div>
                    <h1 className="font-display text-3xl font-semibold text-ink">
                        {status === "loading" ? "Verifying your email..." : status === "success" ? "Email verified" : "Verification failed"}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {status === "loading" && "One moment while we confirm your email address."}
                        {status === "success" && "Your email has been confirmed. Redirecting you to sign in..."}
                        {status === "error" && error}
                    </p>
                </div>
                <div className="mt-7 space-y-3">
                    {status === "error" && (
                        <Link href="/auth/register">
                            <Button variant="outline" className="h-11 w-full rounded-md bg-card">Create a new account</Button>
                        </Link>
                    )}
                    <Link href="/auth/login">
                        <Button className="h-11 w-full rounded-md bg-teal text-white hover:bg-teal/90">
                            {status === "error" ? "Back to sign in" : "Go to sign in"}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-paper p-4">
                <div className="patient-surface w-full max-w-md rounded-lg p-8 text-center">
                    <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-teal/30 bg-scrub text-teal">
                        <Activity className="h-5 w-5" />
                    </div>
                    <h1 className="font-display text-2xl font-semibold text-ink">Loading...</h1>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}

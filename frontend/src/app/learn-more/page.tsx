import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, HeartPulse, Stethoscope } from "lucide-react"
import { RiskLens } from "@/components/RiskLens"

const steps = [
  ["Tell the story", "Enter health history, lifestyle, and current symptoms in guided sections."],
  ["Review the lens", "See where the result sits across Low, Watch, and Review zones."],
  ["Take the report", "Download a readable summary for your appointment or personal history."],
]

export default function LearnMorePage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 lg:px-10">
        <div className="nav-shell mx-auto flex h-16 max-w-7xl items-center gap-4 rounded-lg border border-white/30 bg-white/60 px-4 shadow-lg shadow-black/5 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-slate-900/50">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal/30 bg-scrub/80 text-teal backdrop-blur-sm">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-display text-xl font-semibold text-ink">PinkScan</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            <Link className="hidden rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white/50 hover:text-ink sm:inline-flex" href="/">
              Home
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="rounded-md">Log in</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="rounded-md bg-teal text-white hover:bg-teal/90">Start assessment</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-28">
        <section className="px-4 py-14 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="eyebrow">Patient education guide</p>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-ink">
                What PinkScan can tell you, and what only care can confirm.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-700 dark:text-slate-300">
                PinkScan organizes risk information before a medical conversation. It helps you prepare questions, but it cannot diagnose cancer or replace imaging, biopsy, or a clinician exam.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/auth/register">
                  <Button size="lg" className="rounded-md bg-teal text-white hover:bg-teal/90">
                    Start assessment <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="rounded-md bg-card">
                    View reports
                  </Button>
                </Link>
              </div>
            </div>
            <div className="patient-surface rounded-lg p-5">
              <RiskLens result="High Risk" score={62} />
              <div className="mt-5 rounded-md border border-[#e4b2c1] bg-[#fff1f4] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-med" />
                  <p className="text-sm leading-6 text-slate-800">
                    A higher result means the report should be discussed promptly with a qualified healthcare professional. It is still not a diagnosis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card/55 px-4 py-14">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {steps.map(([title, description], index) => (
              <article key={title} className="patient-surface rounded-lg p-6">
                <div className="mb-5 text-sm font-bold tabular-nums text-teal">0{index + 1}</div>
                <h2 className="text-lg font-bold text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 py-14">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
            <div className="patient-surface rounded-lg p-6">
              <div className="mb-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-teal" />
                <h2 className="font-display text-2xl font-semibold text-ink">Useful for</h2>
              </div>
              <ul className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                <li>Preparing for a non-urgent breast health appointment.</li>
                <li>Keeping risk factors and symptoms in one readable place.</li>
                <li>Sharing a structured PDF summary with a clinician.</li>
              </ul>
            </div>
            <div className="patient-surface rounded-lg p-6">
              <div className="mb-4 flex items-center gap-3">
                <HeartPulse className="h-5 w-5 text-rose-med" />
                <h2 className="font-display text-2xl font-semibold text-ink">Seek care promptly for</h2>
              </div>
              <ul className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                <li>A new breast lump, swelling, skin dimpling, or nipple discharge.</li>
                <li>Persistent breast pain or a change in breast size or shape.</li>
                <li>Any symptom your doctor has told you to monitor closely.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="clinical-surface mx-auto flex max-w-7xl flex-col gap-4 rounded-lg p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-teal">
                <Stethoscope className="h-4 w-4" />
                Ready to create a report you can discuss?
              </div>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Start with the guided assessment and save the PDF to your report history.</p>
            </div>
            <Link href="/auth/register">
              <Button className="rounded-md bg-teal text-white hover:bg-teal/90">
                Begin
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
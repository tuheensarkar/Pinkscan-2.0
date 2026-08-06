import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Activity, ArrowRight, BookOpen, FileText, ShieldCheck, Stethoscope } from "lucide-react"
import { RiskLens } from "@/components/RiskLens"

const features = [
  {
    title: "Guided self-assessment",
    description: "Patients answer health-history and symptom questions in sections that explain what matters and why.",
    icon: Activity,
  },
  {
    title: "Clinician-ready report",
    description: "Each result becomes a structured summary with risk factors, next steps, notes, and a plain disclaimer.",
    icon: FileText,
  },
  {
    title: "Separate clinical workflow",
    description: "Doctors get a denser Wisconsin-model workspace for measurements, confidence, and follow-up documentation.",
    icon: Stethoscope,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 lg:px-10">
      <div className="nav-shell mx-auto flex h-16 max-w-7xl items-center gap-4 rounded-full border border-white/30 bg-white/60 px-4 shadow-lg shadow-black/5 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-slate-900/50">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal/30 bg-scrub/80 text-teal backdrop-blur-sm">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-display text-xl font-semibold text-ink">PinkScan</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <Link className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white/50 hover:text-ink" href="#features">
              Features
            </Link>
            <Link className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white/50 hover:text-ink" href="/learn-more">
              Learn More
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="rounded-md">Log in</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="rounded-md bg-teal text-white hover:bg-teal/90">Start assessment</Button>
            </Link>
          </nav>
          <Link href="/auth/register" className="ml-auto md:hidden">
            <Button size="sm" className="rounded-md bg-teal text-white">Start</Button>
          </Link>
        </div>
      </header>

      <main className="pt-28">
        <section className="px-4 pb-16 pt-10 md:pb-24 md:pt-16">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <p className="eyebrow">Breast health risk support</p>
              <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold leading-[1.02] text-ink md:text-6xl">
                A calmer way to prepare for a breast health conversation.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">
                PinkScan helps patients organize risk information and gives doctors a precise model workspace. The product separates reassurance from clinical review so each audience gets the right level of detail.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/auth/register">
                  <Button size="lg" className="h-12 rounded-md bg-teal px-6 text-base text-white hover:bg-teal/90">
                    Start assessment <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/learn-more">
                  <Button variant="outline" size="lg" className="h-12 rounded-md bg-card px-6 text-base">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Learn how it works
                  </Button>
                </Link>
              </div>
            </div>

            <div className="patient-surface rounded-lg p-5">
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Patient report preview</p>
                    <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Your Risk Lens</h2>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-teal" />
                </div>
                <RiskLens result="Moderate Risk" score={34} />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Key factors", "Family history, dense breast tissue"],
                    ["Next step", "Discuss screening frequency with a clinician"],
                    ["Report use", "Bring to appointment or save to history"],
                    ["Scope", "Screening support, not diagnosis"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-border bg-paper/70 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-700 dark:text-slate-300">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-border bg-card/55 px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-2xl">
              <p className="eyebrow">Built around care moments</p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-ink">Not one dashboard for every user.</h2>
              <p className="mt-3 leading-7 text-slate-700 dark:text-slate-300">
                Patients need clarity and reassurance. Doctors need speed and precision. PinkScan uses different density and rhythm for each.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="patient-surface rounded-lg p-6">
                  <feature.icon className="mb-5 h-5 w-5 text-teal" />
                  <h3 className="text-lg font-bold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-muted-foreground md:flex-row">
          <p>PinkScan supports risk conversations. It does not provide diagnosis.</p>
          <p>Copyright 2026 PinkScan.</p>
        </div>
      </footer>
    </div>
  )
}
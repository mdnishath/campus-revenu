import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui";

const steps = [
  {
    n: "1 · Pick a task",
    body: "Browse the marketplace and choose tasks that fit you — each shows its reward and deadline.",
  },
  {
    n: "2 · Upload proof",
    body: "Do the work and submit a screenshot. Our team reviews it within 24–48 hours.",
  },
  {
    n: "3 · Get paid weekly",
    body: "Approved earnings hit your balance. Withdraw from €20 by SEPA transfer or gift card.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen relative flex flex-col bg-canvas overflow-hidden">
      <div className="cr-glow" />

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 md:px-10 py-5">
        <Logo />
        <nav className="flex items-center gap-5 md:gap-7">
          <a href="#how" className="text-muted text-sm font-medium hidden sm:block">
            How it works
          </a>
          <a href="#how" className="text-muted text-sm font-medium hidden sm:block">
            Tasks
          </a>
          <Link href="/login" className="text-ink text-sm font-semibold no-underline">
            Log in
          </Link>
          <ButtonLink href="/signup" size="sm" className="px-5 py-2.5">
            Get started
          </ButtonLink>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center gap-6 px-6 py-16 md:py-24">
        <div className="flex items-center gap-2 bg-surface border border-line rounded-full px-4 py-1.5">
          <span className="w-[7px] h-[7px] rounded-full bg-success" />
          <span className="text-muted text-[13px] font-medium">
            Paid out weekly · SEPA or gift cards
          </span>
        </div>
        <h1 className="text-ink text-4xl md:text-[52px] font-extrabold -tracking-[1px] leading-[1.1] max-w-4xl">
          Earn extra income as a student in France
        </h1>
        <p className="text-muted text-lg leading-relaxed max-w-2xl">
          Complete small online tasks — social actions, genuine reviews, data entry —
          upload your proof, and get paid every week from €0.80 per task.
        </p>
        <div className="flex flex-col sm:flex-row gap-3.5 mt-1.5 w-full sm:w-auto">
          <ButtonLink href="/signup" size="lg">
            Start earning
          </ButtonLink>
          <ButtonLink href="/login" size="lg" variant="secondary">
            I have an account
          </ButtonLink>
        </div>
      </section>

      {/* Steps */}
      <section id="how" className="relative grid grid-cols-1 md:grid-cols-3 gap-5 px-6 md:px-10 pb-10 max-w-6xl mx-auto w-full">
        {steps.map((s) => (
          <div
            key={s.n}
            className="bg-surface border border-line rounded-[12px] p-[22px] flex flex-col gap-2"
          >
            <div className="text-accent text-[13px] font-bold">{s.n}</div>
            <div className="text-muted text-sm leading-relaxed">{s.body}</div>
          </div>
        ))}
      </section>

      {/* Trust footer */}
      <footer className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-6 border-t border-line text-center">
        <span className="text-faint text-xs">🇫🇷 For students in France only</span>
        <span className="text-line hidden sm:inline">·</span>
        <span className="text-faint text-xs">GDPR-compliant · EU-hosted data</span>
        <span className="text-line hidden sm:inline">·</span>
        <span className="text-faint text-xs">Genuine tasks only — no fake reviews</span>
      </footer>
    </div>
  );
}

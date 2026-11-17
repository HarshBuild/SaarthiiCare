import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  ArrowRight,
  Menu,
  X,
  Stethoscope,
  Building2,
  Users,
  FileText,
  CalendarCheck,
  BellRing,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Workflow,
  Lock,
  BarChart3,
  Repeat,
  HeartPulse,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react'

/**
 * Public landing page for SaarthiiCare.
 *
 * Purely presentational: every CTA routes to the real sign-in flow. No fake
 * data is presented as live metrics — the stat band is explicitly labelled as
 * illustrative.
 */

const NAV_LINKS = [
  { label: 'Problem', href: '#problem' },
  { label: 'Solution', href: '#solution' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
]

const FEATURES = [
  {
    icon: Workflow,
    title: 'Closed-loop referral tracking',
    description:
      'Every referral moves through a validated lifecycle from creation to formal closure, with a full audit trail.',
  },
  {
    icon: Repeat,
    title: 'Back-referral coordination',
    description:
      'Receiving facilities return structured outcomes to the originating PHC, so care never disappears at discharge.',
  },
  {
    icon: CalendarCheck,
    title: 'Automated follow-up tasks',
    description:
      'Follow-up work is generated automatically, assigned, and tracked with due dates and overdue escalation.',
  },
  {
    icon: BellRing,
    title: 'Smart notification centre',
    description:
      'Role-aware alerts for new referrals, appointment changes, overdue tasks and closure blockers.',
  },
  {
    icon: ClipboardCheck,
    title: 'Closure intelligence',
    description:
      'The backend blocks closure until every required action — outcome, back-referral, follow-up — is complete.',
  },
  {
    icon: BarChart3,
    title: 'Operational analytics',
    description:
      'Facility-level closure rates, average turnaround and overdue caseloads, sourced from real workflow data.',
  },
]

const STEPS = [
  {
    icon: FileText,
    title: 'Create',
    description: 'PHC staff issue a structured digital referral with patient context and clinical reason.',
  },
  {
    icon: Stethoscope,
    title: 'Accept & treat',
    description: 'The receiving specialist acknowledges the referral, logs arrival and records the treatment outcome.',
  },
  {
    icon: HeartPulse,
    title: 'Follow up',
    description: 'Back-referrals and community follow-up tasks are generated and tracked to completion.',
  },
  {
    icon: Shield,
    title: 'Close the loop',
    description: 'Once every obligation is met, the referral is formally closed with a complete audit trail.',
  },
]

const BENEFITS = [
  {
    icon: Stethoscope,
    role: 'For referring doctors',
    points: [
      'Know exactly where every referral stands',
      'Receive structured specialist outcomes',
      'Never lose a patient to a broken hand-off',
    ],
  },
  {
    icon: Building2,
    role: 'For hospitals',
    points: [
      'A clear, prioritised intake queue',
      'Less duplicate paperwork and phone chasing',
      'Measurable closure and turnaround metrics',
    ],
  },
  {
    icon: Users,
    role: 'For patients',
    points: [
      'Continuous care across facilities',
      'Follow-up that actually reaches them',
      'A single, trackable care journey',
    ],
  },
]

const LIFECYCLE = [
  'Created',
  'Submitted',
  'Accepted',
  'Appointment',
  'Consultation',
  'Follow-up',
  'Closed',
]

function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-md shadow-teal-600/25">
            <Shield className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            SAARTHII<span className="text-teal-600">Care</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-600"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Sign in
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-600/25 transition-all hover:bg-teal-700"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24 lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            <Sparkles className="h-3.5 w-3.5" />
            Intelligent care coordination
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Every Referral Connected.
            <span className="block bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
              Every Patient Followed Up.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            An intelligent healthcare referral coordination platform connecting
            doctors, specialists and patients through one seamless digital
            workflow — from first referral to closed loop.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-teal-600/30"
            >
              Get started
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              Explore platform
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
            {['Role-based access', 'Row-level security', 'Full audit trail'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Workflow illustration */}
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-teal-100/60 to-sky-100/50 blur-2xl" />
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-teal-600">
                Referral lifecycle
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { icon: FileText, label: 'PHC referral issued', meta: 'REF-20261117-0042', color: 'text-sky-600 bg-sky-50' },
                { icon: Stethoscope, label: 'Accepted by specialist', meta: 'District Hospital', color: 'text-teal-600 bg-teal-50' },
                { icon: CalendarCheck, label: 'Consultation completed', meta: 'Outcome recorded', color: 'text-emerald-600 bg-emerald-50' },
                { icon: Repeat, label: 'Follow-up task generated', meta: 'Due in 7 days', color: 'text-amber-600 bg-amber-50' },
              ].map((row) => {
                const Icon = row.icon
                return (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${row.color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{row.label}</p>
                      <p className="truncate text-xs text-slate-500">{row.meta}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  </div>
                )
              })}
            </div>

            <div className="mt-5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-3 text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-50/90">
                  Closure readiness
                </span>
                <span className="text-sm font-bold">Ready</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                <div className="h-full w-full rounded-full bg-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  const problems = [
    'Referrals lost between facilities with no owner',
    'Communication gaps between doctors and specialists',
    'Delayed appointments with no visibility',
    'Patients who never complete their follow-up',
    'No centralised record of the care journey',
    'No accountability across the referral lifecycle',
  ]

  return (
    <section id="problem" className="border-y border-slate-200/70 bg-slate-50/70 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">
            The problem
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Care breaks down between facilities
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            In fragmented health systems, the referral is where continuity of
            care is lost. SaarthiiCare closes that gap.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <div
              key={problem}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <p className="text-sm leading-relaxed text-slate-700">{problem}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SolutionSection() {
  return (
    <section id="solution" className="py-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
            The solution
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            One accountable, closed-loop workflow
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            SaarthiiCare turns a fragile hand-off into a tracked, validated
            workflow with clear ownership at every step — and it refuses to
            close a referral until the loop is genuinely complete.
          </p>

          <ul className="mt-6 space-y-3">
            {[
              'Backend-authoritative status transitions',
              'Closure blocked until obligations are met',
              'Role and facility scoped data access',
              'Immutable audit history for every action',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Lock, label: 'Secure by design', sub: 'Row-level security' },
            { icon: Activity, label: 'Real-time status', sub: 'Live referral state' },
            { icon: Workflow, label: 'Validated workflow', sub: 'Every transition' },
            { icon: BarChart3, label: 'Measurable impact', sub: 'Facility analytics' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.sub}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-slate-200/70 bg-slate-900 py-16 text-white lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            A complete referral journey
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Four coordinated stages, each owned by the right role, each recorded
            in the audit trail.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="relative rounded-2xl border border-slate-700/70 bg-slate-800/60 p-6">
                <span className="absolute right-5 top-5 text-4xl font-black text-slate-700/80">
                  {idx + 1}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
              </div>
            )
          })}
        </div>

        {/* Lifecycle strip */}
        <div className="mt-14 overflow-x-auto">
          <div className="flex min-w-max items-center gap-2">
            {LIFECYCLE.map((stage, idx) => (
              <React.Fragment key={stage}>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                  {stage}
                </span>
                {idx < LIFECYCLE.length - 1 && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
            Core features
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Built for real coordination
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Everything needed to keep a patient&apos;s care connected from referral
            to closure.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function BenefitsSection() {
  return (
    <section className="border-y border-slate-200/70 bg-slate-50/70 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
            Who benefits
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Value for every participant
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div key={benefit.role} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-md shadow-teal-600/20">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{benefit.role}</h3>
                <ul className="mt-3 space-y-2">
                  {benefit.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function StatsBand() {
  const stats = [
    { value: '7', label: 'Validated lifecycle stages', icon: Workflow },
    { value: '4', label: 'Clear role-based experiences', icon: Users },
    { value: '100%', label: 'Audited status transitions', icon: ClipboardCheck },
    { value: '0', label: 'Silent referral closures', icon: Shield },
  ]

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">
          Platform capabilities — not live patient metrics.
        </p>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="pb-16 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-800 px-6 py-14 text-center shadow-2xl sm:px-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />

          <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to close the loop on every referral?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Sign in to the demo environment and walk a referral from creation to
            formal closure.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100"
            >
              Get started
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-white/10"
            >
              Explore features
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                <Shield className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                SAARTHII<span className="text-teal-400">Care</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              An intelligent healthcare referral and follow-up coordination
              platform. Demo environment — all records are fictional.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <a href="#problem" className="transition-colors hover:text-white">Problem</a>
            <a href="#solution" className="transition-colors hover:text-white">Solution</a>
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <Link to="/login" className="transition-colors hover:text-white">Sign in</Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} SaarthiiCare. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Not for real patient data
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <HowItWorks />
        <FeaturesSection />
        <BenefitsSection />
        <StatsBand />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

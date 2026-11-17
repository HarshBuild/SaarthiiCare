import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  Workflow,
  Repeat,
  BellRing,
  Users,
} from 'lucide-react'

/**
 * Shared premium split-screen shell for the authentication pages.
 *
 * Left: brand story and platform guarantees (static marketing copy).
 * Right: the actual form supplied by the page.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px]" />
        </div>

        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-500/25">
              <Shield className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">
              SAARTHII<span className="text-teal-400">Care</span>
            </span>
          </Link>

          <h1 className="mt-14 max-w-md text-4xl font-bold leading-[1.15] tracking-tight text-white xl:text-5xl">
            Every referral connected.
            <span className="mt-1 block text-teal-400">Every patient followed up.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
            A closed-loop referral and follow-up platform for primary health
            centres, hospitals and district supervisors.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              { icon: Workflow, text: 'Validated referral lifecycle with an audit trail' },
              { icon: Repeat, text: 'Back-referrals returned to the originating PHC' },
              { icon: BellRing, text: 'Follow-up tasks with due dates and escalation' },
              { icon: Users, text: 'Role and facility scoped access via row-level security' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <li key={item.text} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-teal-400 ring-1 ring-white/10">
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.text}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="relative mt-12 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-400" />
          <p className="text-xs leading-relaxed text-slate-400">
            Demo environment. All records are fictional and no production patient
            data is stored.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                <Shield className="h-5 w-5" />
              </span>
              <span className="text-base font-bold tracking-tight text-slate-900">
                SAARTHII<span className="text-teal-600">Care</span>
              </span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
              {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
            </div>

            {children}

            {footer && <div className="mt-7 border-t border-slate-100 pt-5">{footer}</div>}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} SaarthiiCare · Referral coordination platform
          </p>
        </div>
      </main>
    </div>
  )
}

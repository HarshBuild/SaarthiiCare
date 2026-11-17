import React from 'react'
import { Check, X } from 'lucide-react'
import { WORKFLOW_STAGES, getStageIndex, getStatusMeta } from '../../utils/referralStatus'

/**
 * Seven-stage visual workflow for a single referral.
 *
 * The database status is authoritative; this component only positions that
 * status on the journey: Created → Submitted → Accepted → Appointment →
 * Consultation → Follow-up → Closed.
 */
export default function WorkflowProgress({ status, className = '' }) {
  const meta = getStatusMeta(status)
  const currentStage = getStageIndex(status)
  const isTerminated = status === 'rejected' || status === 'cancelled'
  const isClosed = status === 'closed'

  return (
    <div className={className}>
      <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:justify-between">
        {WORKFLOW_STAGES.map((stage, index) => {
          const complete =
            !isTerminated && (index < currentStage || (isClosed && index <= currentStage))
          const current = !isTerminated && index === currentStage && !isClosed
          const upcoming = isTerminated || index > currentStage

          return (
            <li
              key={stage}
              className="relative flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:gap-2"
              aria-current={current ? 'step' : undefined}
            >
              {/* Connector (desktop) */}
              {index < WORKFLOW_STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 sm:left-1/2 sm:top-4 sm:h-0.5 sm:w-full sm:translate-x-4 ${
                    index < currentStage && !isTerminated ? 'bg-teal-500' : 'bg-slate-200'
                  }`}
                />
              )}

              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                  complete
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : current
                      ? 'border-teal-600 bg-white text-teal-700 ring-4 ring-teal-500/15'
                      : isTerminated && index === currentStage
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {complete ? (
                  <Check className="h-4 w-4" />
                ) : isTerminated && index === currentStage ? (
                  <X className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </span>

              <span
                className={`mt-1.5 pb-4 text-left text-[11px] font-semibold leading-tight sm:mt-0 sm:pb-0 sm:text-center ${
                  complete || current
                    ? 'text-slate-900'
                    : isTerminated && index === currentStage
                      ? 'text-rose-700'
                      : 'text-slate-400'
                } ${upcoming && !current ? 'sm:max-w-[5.5rem]' : ''}`}
              >
                {stage}
              </span>
            </li>
          )
        })}
      </ol>

      <p className="mt-3 text-xs text-slate-500">
        Current state: <span className="font-semibold text-slate-700">{meta.label}</span>
        {isTerminated && ' — this referral did not complete the standard journey.'}
      </p>
    </div>
  )
}

import React, { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Shield,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  User,
  Heart,
  Activity,
  RefreshCw,
  FileText,
  Stethoscope,
  Waypoints,
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../contexts/AuthContext'
import { ReferralDetailsClient } from '../../services/referralsService'
import ReferralTimeline from '../../components/layout/ReferralTimeline'
import WorkflowProgress from '../../components/referrals/WorkflowProgress'
import { getStatusMeta, isTerminalStatus } from '../../utils/referralStatus'

const MISSING_ACTION_LABELS = {
  OUTCOME_NOT_RECORDED: 'Treatment outcome',
  BACK_REFERRAL_PENDING: 'Back-referral report',
  FOLLOW_UP_PENDING: 'Follow-up task',
}

const MISSING_ACTION_ICONS = {
  OUTCOME_NOT_RECORDED: Heart,
  BACK_REFERRAL_PENDING: Shield,
  FOLLOW_UP_PENDING: Calendar,
}

function formatDate(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN')
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-900">{value || 'N/A'}</p>
    </div>
  )
}

export default function ReferralDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { profile } = useAuth()
  const isHospital = profile?.role === 'hospital_staff'

  const [referral, setReferral] = useState(null)
  const [closureCheck, setClosureCheck] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [closing, setClosing] = useState(false)

  const fetchReferralDetails = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ReferralDetailsClient.get(id)
      setReferral(data)

      // Closure intelligence is supplementary: a failure here should not hide
      // the referral record itself.
      try {
        const check = await ReferralDetailsClient.checkClosure(id)
        setClosureCheck(check)
      } catch {
        setClosureCheck(null)
      }
    } catch (err) {
      setError('Failed to load referral details. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchReferralDetails()
  }, [fetchReferralDetails])

  const handleCloseReferral = async () => {
    setClosing(true)
    try {
      await ReferralDetailsClient.close(id)
      toast.success('Referral closed successfully.', 'Closed')
      await fetchReferralDetails()
    } catch (err) {
      if (err.response?.status === 422) {
        toast.error(
          err.response.data.detail || 'Closure requirements are not met.',
          'Cannot close referral',
        )
      } else {
        toast.error('Failed to close referral. Please try again.')
      }
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    )
  }

  if (error || !referral) {
    return (
      <div className="space-y-4">
        <Alert
          variant="danger"
          title="Referral unavailable"
          message={error || 'Referral not found.'}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReferralDetails}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Link to="/referrals">
            <Button variant="ghost">Back to referrals</Button>
          </Link>
        </div>
      </div>
    )
  }

  const meta = getStatusMeta(referral.status)
  const terminal = isTerminalStatus(referral.status)
  const eligible = Boolean(closureCheck?.eligible_for_closure)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/referrals" aria-label="Back to referrals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-mono text-xl font-bold tracking-tight text-slate-900">
                {referral.referral_number || referral.id}
              </h1>
              <Badge variant={meta.variant}>{meta.label}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {referral.patient_name} · {referral.specialty?.replace(/_/g, ' ') || 'Specialty not set'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fetchReferralDetails}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/qr/${id}`)}>
            <FileText className="h-4 w-4" />
            QR reference
          </Button>
        </div>
      </div>

      {/* Workflow */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Waypoints className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Referral workflow</CardTitle>
              <CardDescription>Created → Submitted → Accepted → Appointment → Consultation → Follow-up → Closed</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <WorkflowProgress status={referral.status} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Referral information</CardTitle>
              <CardDescription>
                Created {formatDate(referral.created_at)}
                {referral.patient_id ? ` · Patient ${referral.patient_id}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Patient name" value={referral.patient_name} />
                <InfoRow
                  label="Age / gender"
                  value={`${referral.patient_age ?? 'N/A'} / ${
                    referral.patient_gender
                      ? referral.patient_gender.charAt(0).toUpperCase() +
                        referral.patient_gender.slice(1)
                      : 'N/A'
                  }`}
                />
                <InfoRow
                  label="Specialty"
                  value={referral.specialty?.replace(/_/g, ' ')}
                />
                <InfoRow label="Receiving facility" value={referral.receiving_facility_name} />
                <InfoRow label="Reason for referral" value={referral.reason} />
                <InfoRow
                  label="Follow-up"
                  value={
                    referral.follow_up_required
                      ? `Required${referral.follow_up_due_date ? ` · due ${formatDate(referral.follow_up_due_date)}` : ''}`
                      : 'Not required'
                  }
                />
              </div>

              {referral.clinical_summary && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Clinical summary
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm leading-relaxed text-slate-700">
                      {referral.clinical_summary}
                    </p>
                  </div>
                </div>
              )}

              {referral.outcome && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Recorded outcome
                  </p>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                    <p className="text-sm leading-relaxed text-emerald-900">
                      {referral.outcome.summary ||
                        referral.outcome.diagnosis ||
                        referral.outcome.outcome_notes ||
                        'Outcome recorded at the receiving facility.'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Workflow timeline</CardTitle>
                  <CardDescription>Audit trail of every recorded event</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ReferralTimeline events={referral.events || []} />
            </CardContent>
          </Card>
        </div>

        {/* Closure intelligence */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle className="text-base">Closure intelligence</CardTitle>
                  <CardDescription>Backend-validated workflow rules</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {closureCheck ? (
                <div className="space-y-4">
                  <div
                    className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                      eligible
                        ? 'border-emerald-200 bg-emerald-50/70'
                        : 'border-rose-200 bg-rose-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {eligible ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                      )}
                      <span
                        className={`text-sm font-semibold ${
                          eligible ? 'text-emerald-900' : 'text-rose-900'
                        }`}
                      >
                        {eligible ? 'Eligible for closure' : 'Closure blocked'}
                      </span>
                    </div>
                    {eligible && referral.status !== 'closed' && (
                      <Button size="sm" loading={closing} onClick={handleCloseReferral}>
                        <Shield className="h-3.5 w-3.5" />
                        Close
                      </Button>
                    )}
                    {referral.status === 'closed' && (
                      <Badge variant="success" size="sm" dot>
                        Closed
                      </Badge>
                    )}
                  </div>

                  {closureCheck.missing_actions?.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Required before closure
                      </h4>
                      <ul className="space-y-1.5">
                        {closureCheck.missing_actions.map((action) => {
                          const Icon = MISSING_ACTION_ICONS[action] || AlertCircle
                          return (
                            <li
                              key={action}
                              className="flex items-center gap-2 text-xs text-slate-700"
                            >
                              <Icon className="h-3.5 w-3.5 text-amber-600" />
                              {MISSING_ACTION_LABELS[action] || action}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {(closureCheck.responsible_facility || closureCheck.responsible_role) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <h4 className="mb-1.5 text-[11px] font-semibold text-amber-800">
                        Responsible party
                      </h4>
                      <p className="text-xs text-amber-700">
                        {closureCheck.responsible_facility || 'N/A'} ·{' '}
                        {closureCheck.responsible_role || 'N/A'}
                      </p>
                    </div>
                  )}

                  {closureCheck.explanation && (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                      {closureCheck.explanation}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <Clock className="mx-auto mb-1.5 h-6 w-6 text-slate-400" />
                  <p className="text-xs text-slate-500">Closure check unavailable.</p>
                  <button
                    type="button"
                    onClick={fetchReferralDetails}
                    className="mt-2 text-xs font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Run check again
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next actions</CardTitle>
              <CardDescription>Move the referral forward</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isHospital && ['issued', 'pending_ack'].includes(referral.status) && (
                <Button
                  variant="outline"
                  fullWidth
                  className="justify-start"
                  onClick={() => navigate('/hospital-dashboard')}
                >
                  <Stethoscope className="h-4 w-4" />
                  Open intake queue
                </Button>
              )}

              {isHospital && ['issued', 'acknowledged'].includes(referral.status) && (
                <Button
                  variant="outline"
                  fullWidth
                  className="justify-start"
                  onClick={() => navigate(`/hospital/arrival/${id}`)}
                >
                  <User className="h-4 w-4" />
                  Record patient arrival
                </Button>
              )}

              {isHospital && referral.status === 'arrived' && (
                <Button
                  variant="outline"
                  fullWidth
                  className="justify-start"
                  onClick={() => navigate(`/outcomes/${id}`)}
                >
                  <Heart className="h-4 w-4" />
                  Record treatment outcome
                </Button>
              )}

              {isHospital && !terminal && (
                <Button
                  variant="outline"
                  fullWidth
                  className="justify-start"
                  onClick={() => navigate(`/back-referral/${id}`)}
                >
                  <Shield className="h-4 w-4" />
                  Create back-referral
                </Button>
              )}

              {!isHospital && ['issued', 'pending_ack'].includes(referral.status) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs leading-relaxed text-amber-800">
                    This referral is waiting for the receiving facility to acknowledge it. No
                    action is required from the referring PHC right now.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                fullWidth
                className="justify-start"
                onClick={() => navigate('/follow-ups')}
              >
                <Activity className="h-4 w-4" />
                Follow-up workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

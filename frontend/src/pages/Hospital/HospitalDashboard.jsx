import React, { useEffect, useMemo, useState } from 'react'
import {
  FileText,
  AlertCircle,
  ClipboardCheck,
  Stethoscope,
  CheckCircle2,
  RefreshCw,
  Inbox,
  ArrowRight,
  Activity,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import StatCard from '../../components/layout/StatCard'
import { ReferralListClient, HospitalClient } from '../../services/referralsService'
import { useToast } from '../../components/ui/Toast'
import { getStatusMeta, isOpenStatus, isTerminalStatus } from '../../utils/referralStatus'

const PRIORITY_RANK = { emergency: 0, urgent: 1, routine: 2 }

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
}

function urgencyBadge(referral) {
  const urgency = referral.urgency || referral.priority || 'routine'
  if (urgency === 'emergency') return <Badge variant="danger" size="sm">Emergency</Badge>
  if (urgency === 'urgent') return <Badge variant="warning" size="sm">Urgent</Badge>
  return <Badge variant="info" size="sm">Routine</Badge>
}

export default function HospitalDashboard() {
  const navigate = useNavigate()
  const toast = useToast()
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acknowledgingId, setAcknowledgingId] = useState(null)

  const fetchReferrals = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ReferralListClient.list()
      setReferrals(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load referrals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReferrals()
  }, [])

  const summary = useMemo(() => {
    const pending = referrals.filter((r) => ['issued', 'pending_ack'].includes(r.status))
    const inTreatment = referrals.filter((r) => ['acknowledged', 'arrived'].includes(r.status))
    const outcomes = referrals.filter((r) => r.status === 'outcome_recorded')
    const open = referrals.filter((r) => isOpenStatus(r.status))
    const queue = [...open].sort((a, b) => {
      const pendingRank = (r) => (['issued', 'pending_ack'].includes(r.status) ? 0 : 1)
      const statusRank = pendingRank(a) - pendingRank(b)
      if (statusRank !== 0) return statusRank
      const rank = (PRIORITY_RANK[a.urgency] ?? 2) - (PRIORITY_RANK[b.urgency] ?? 2)
      if (rank !== 0) return rank
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return { pending, inTreatment, outcomes, open, queue }
  }, [referrals])

  const stats = [
    { label: 'Incoming referrals', value: referrals.length, icon: FileText },
    { label: 'Pending acknowledgement', value: summary.pending.length, icon: AlertCircle },
    { label: 'In treatment', value: summary.inTreatment.length, icon: Stethoscope },
    { label: 'Outcomes recorded', value: summary.outcomes.length, icon: CheckCircle2 },
  ]

  const handleAcknowledge = async (id) => {
    setAcknowledgingId(id)
    try {
      await HospitalClient.acknowledge(id)
      toast.success('Referral acknowledged.')
      await fetchReferrals()
    } catch (err) {
      toast.error('Failed to acknowledge referral.')
    } finally {
      setAcknowledgingId(null)
    }
  }

  const renderAction = (row) => {
    if (['issued', 'pending_ack'].includes(row.status)) {
      return (
        <Button
          size="sm"
          variant="secondary"
          loading={acknowledgingId === row.id}
          onClick={() => handleAcknowledge(row.id)}
        >
          Acknowledge
        </Button>
      )
    }
    if (row.status === 'acknowledged') {
      return (
        <Link to={`/hospital/arrival/${row.id}`}>
          <Button size="sm">Record arrival</Button>
        </Link>
      )
    }
    if (row.status === 'arrived') {
      return (
        <Link to={`/outcomes/${row.id}`}>
          <Button size="sm">Record outcome</Button>
        </Link>
      )
    }
    return (
      <Link to={`/referrals/${row.id}`}>
        <Button size="sm" variant="outline">View</Button>
      </Link>
    )
  }

  const emptyQueue = !loading && !error && summary.queue.length === 0
  const closedCount = referrals.filter((r) => isTerminalStatus(r.status)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the intake queue, patient arrivals and treatment outcomes.
          </p>
        </div>
        <Link to="/referrals">
          <Button variant="outline">
            <FileText className="h-4 w-4" />
            Full referral register
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger" title="Could not load referrals" message={error} dismissible />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={loading ? '…' : stat.value.toString()}
            change={0}
            icon={stat.icon}
            variant="teal"
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Intake queue</CardTitle>
              <CardDescription>Open referrals awaiting acknowledgement or treatment</CardDescription>
            </div>
            <Badge variant={summary.pending.length ? 'warning' : 'success'} dot>
              {summary.pending.length} awaiting action
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="h-7 w-7 text-rose-400" />
              <p className="text-sm text-slate-600">The intake queue could not be loaded.</p>
              <Button variant="outline" size="sm" onClick={fetchReferrals}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : emptyQueue ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
                <Inbox className="h-7 w-7 text-teal-600" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">The queue is clear</p>
                <p className="mt-1 text-sm text-slate-500">
                  {closedCount} referral{closedCount === 1 ? '' : 's'} closed for this facility.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Patient</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Referral</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Specialty</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Urgency</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Created</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.queue.map((row) => {
                    const meta = getStatusMeta(row.status)
                    return (
                      <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-3 py-3">
                          <div className="text-sm font-medium text-slate-900">{row.patient_name}</div>
                          <div className="text-xs text-slate-400">
                            {row.patient_age ? `${row.patient_age} years` : 'Age not recorded'}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            to={`/referrals/${row.id}`}
                            className="font-mono text-xs font-medium text-teal-600 hover:text-teal-700"
                          >
                            {row.referral_number || row.id}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-sm capitalize text-slate-600">
                          {row.specialty?.replace(/_/g, ' ') || '—'}
                        </td>
                        <td className="px-3 py-3">{urgencyBadge(row)}</td>
                        <td className="px-3 py-3">
                          <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500">{formatDate(row.created_at)}</td>
                        <td className="px-3 py-3">{renderAction(row)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Back-referral obligations</CardTitle>
            <CardDescription>Referrals that stay open until a report is returned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-800">
                <Activity className="h-4 w-4" />
                Back-referral pending
              </span>
              <span className="text-sm font-bold text-amber-900">
                {referrals.filter((r) => r.status === 'back_referral_pending').length}
              </span>
            </div>
            <Link
              to="/referrals"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Review referrals
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outcome recording</CardTitle>
            <CardDescription>Consultations completed at this facility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800">
                <ClipboardCheck className="h-4 w-4" />
                Outcomes recorded
              </span>
              <span className="text-sm font-bold text-emerald-900">{summary.outcomes.length}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/referrals')}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Find a referral to update
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

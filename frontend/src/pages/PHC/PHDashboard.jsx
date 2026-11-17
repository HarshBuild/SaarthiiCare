import React, { useEffect, useMemo, useState } from 'react'
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlusCircle,
  Activity,
  ArrowRight,
  RefreshCw,
  Inbox,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import StatCard from '../../components/layout/StatCard'
import { ReferralListClient } from '../../services/referralsService'
import { getStatusMeta, isClosedStatus, isOpenStatus, isTerminalStatus } from '../../utils/referralStatus'

const PRIORITY_RANK = { emergency: 0, urgent: 1, routine: 2 }

function sortByPriority(referrals) {
  return [...referrals].sort((a, b) => {
    const rank = (PRIORITY_RANK[a.urgency] ?? 2) - (PRIORITY_RANK[b.urgency] ?? 2)
    if (rank !== 0) return rank
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
}

export default function PHDashboard() {
  const navigate = useNavigate()
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = async () => {
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
    fetchDashboardData()
  }, [])

  const summary = useMemo(() => {
    const open = referrals.filter((r) => isOpenStatus(r.status))
    const awaiting = referrals.filter((r) => ['issued', 'pending_ack'].includes(r.status))
    const followUp = referrals.filter(
      (r) => isOpenStatus(r.status) && (r.follow_up_required || r.status.startsWith('follow_up')),
    )
    const closed = referrals.filter((r) => isClosedStatus(r.status))
    const terminal = referrals.filter((r) => isTerminalStatus(r.status))
    return {
      open,
      awaiting,
      followUp,
      closed,
      closureRate: terminal.length ? Math.round((closed.length / terminal.length) * 100) : 0,
      queue: sortByPriority(open).slice(0, 6),
    }
  }, [referrals])

  const stats = [
    { label: 'Referrals issued', value: referrals.length, icon: FileText },
    { label: 'Open referrals', value: summary.open.length, icon: Clock },
    { label: 'Awaiting acknowledgement', value: summary.awaiting.length, icon: AlertCircle },
    { label: 'Closed loop completion', value: `${summary.closureRate}%`, icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">PHC Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor outgoing referrals and follow-up obligations for your facility.
          </p>
        </div>
        <Button onClick={() => navigate('/referrals/new')}>
          <PlusCircle className="h-4 w-4" />
          New referral
        </Button>
      </div>

      {error && (
        <Alert
          variant="danger"
          title="Could not load dashboard"
          message={error}
          dismissible
        />
      )}

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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Priority queue</CardTitle>
                <CardDescription>Open referrals, urgent first</CardDescription>
              </div>
              <Link to="/referrals" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700">
                All referrals
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
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
                <p className="text-sm text-slate-600">Dashboard data is unavailable.</p>
                <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : summary.queue.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
                  <Inbox className="h-7 w-7 text-teal-600" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">No open referrals</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Every referral for this facility is closed.
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate('/referrals/new')}>
                  Create referral
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Patient</th>
                      <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Referral</th>
                      <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Receiving facility</th>
                      <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Created</th>
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
                          <td className="px-3 py-3 text-sm text-slate-600">{row.receiving_facility_name}</td>
                          <td className="px-3 py-3">
                            <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-500">{formatDate(row.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Closure intelligence</CardTitle>
              <CardDescription>What is blocking closure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="text-xs font-medium text-slate-600">Open referrals</span>
                <span className="text-sm font-bold text-slate-900">{summary.open.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5">
                <span className="text-xs font-medium text-amber-800">Follow-up required</span>
                <span className="text-sm font-bold text-amber-900">{summary.followUp.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
                <span className="text-xs font-medium text-emerald-800">Closed</span>
                <span className="text-sm font-bold text-emerald-900">{summary.closed.length}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                The backend blocks closure until outcomes, back-referrals and follow-ups are complete.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" fullWidth className="justify-start" onClick={() => navigate('/referrals/new')}>
                <PlusCircle className="h-4 w-4" />
                Create referral
              </Button>
              <Button variant="outline" fullWidth className="justify-start" onClick={() => navigate('/follow-ups')}>
                <Activity className="h-4 w-4" />
                Follow-up workspace
              </Button>
              <Button variant="outline" fullWidth className="justify-start" onClick={() => navigate('/referrals')}>
                <FileText className="h-4 w-4" />
                Referral register
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

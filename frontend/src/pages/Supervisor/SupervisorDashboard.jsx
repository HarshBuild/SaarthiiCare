import React, { useState, useEffect } from 'react'
import { 
  FileText, Calendar, AlertCircle, CheckCircle, Clock, UserPlus, 
  ClipboardCheck, TrendingUp, BarChart3, Activity, Users, MapPin, RefreshCw 
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Alert from '../../components/ui/Alert'
import { SupervisorClient, ReferralListClient } from '../../services/referralsService'
import StatCard from '../../components/layout/StatCard'
import { Link } from 'react-router-dom'

export default function SupervisorDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [overdueReferrals, setOverdueReferrals] = useState([])
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [analyticsData, overdueData, referralsData] = await Promise.all([
        SupervisorClient.getAnalytics(),
        SupervisorClient.getOverdue(),
        ReferralListClient.list()
      ])
      setAnalytics(analyticsData)
      setOverdueReferrals(overdueData || [])
      setReferrals(referralsData || [])
    } catch (err) {
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const stats = analytics ? [
    { label: 'Referrals this Month', value: analytics.total_referrals.toString(), change: 0, icon: FileText },
    { label: 'Avg Closure Time', value: `${analytics.avg_closure_time_days}d`, change: 0, icon: Clock },
    { label: 'Overdue Cases', value: analytics.overdue_count.toString(), change: 0, icon: AlertCircle },
    { label: 'Closure Rate', value: `${analytics.total_closure_rate}%`, change: 0, icon: CheckCircle },
  ] : [
    { label: 'Referrals this Month', value: '-', change: 0, icon: FileText },
    { label: 'Avg Closure Time', value: '-', change: 0, icon: Clock },
    { label: 'Overdue Cases', value: '-', change: 0, icon: AlertCircle },
    { label: 'Closure Rate', value: '-', change: 0, icon: CheckCircle },
  ]

  const facilities = analytics?.facilities || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Supervisor Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor referral performance, identify bottlenecks, and manage cross-facility workflow accountability
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            variant="teal"
          />
        ))}
      </div>

      {error && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Alert variant="danger" title="Could not load analytics" message={error} className="flex-1" />
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/referrals" className="block">
          <Card hoverable>
            <CardContent className="p-4 text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-teal-600" />
              <p className="text-sm font-medium text-slate-900">Referral register</p>
              <p className="mt-0.5 text-xs text-slate-500">Search and filter every referral</p>
            </CardContent>
          </Card>
        </Link>
        <a href="#facility-performance" className="block">
          <Card hoverable>
            <CardContent className="p-4 text-center">
              <BarChart3 className="mx-auto mb-2 h-8 w-8 text-teal-600" />
              <p className="text-sm font-medium text-slate-900">Facility performance</p>
              <p className="mt-0.5 text-xs text-slate-500">Closure rates by receiving facility</p>
            </CardContent>
          </Card>
        </a>
        <Link to="/settings" className="block">
          <Card hoverable>
            <CardContent className="p-4 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-teal-600" />
              <p className="text-sm font-medium text-slate-900">Settings & access</p>
              <p className="mt-0.5 text-xs text-slate-500">Profile and facility assignment</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Facility Performance */}
      <Card id="facility-performance">
        <CardHeader>
          <CardTitle>Facility Performance</CardTitle>
          <CardDescription>
            Cross-facility referral closure rates and average completion times
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-slate-200/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : facilities.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 mb-4">
                <MapPin className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No facility data</h3>
              <p className="text-slate-500 max-w-sm">Enable facility monitoring to view performance metrics.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {facilities.map((facility, idx) => (
                <div key={idx} className="flex items-center py-4 last:mb-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{facility.facility_name}</p>
                        <p className="text-xs capitalize text-slate-500">
                          {facility.facility_type?.replace(/_/g, ' ') || 'facility'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-900">{facility.referrals_total}</p>
                        <p className="text-xs text-slate-500">Referrals</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-900">{facility.closure_rate}%</p>
                        <p className="text-xs text-slate-500">Closure Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-900">{facility.avg_time_days}d</p>
                        <p className="text-xs text-slate-500">Avg Time</p>
                      </div>
                      {facility.closure_rate < 80 && (
                        <Badge variant="warning" size="sm">Needs Attention</Badge>
                      )}
                    </div>
                  </div>
                  <Link to="/referrals">
                    <Button size="sm" variant="outline">
                      View Referrals
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Referrals Alert */}
      {!loading && !error && overdueReferrals.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overdue referrals</CardTitle>
            <CardDescription>Referrals requiring immediate supervisor attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                No overdue referrals right now. Every open referral is within its expected window.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && overdueReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overdue Referrals</CardTitle>
            <CardDescription>
              Referrals requiring immediate supervisor attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-rose-50/50">
                    <th className="px-4 py-3 text-xs font-semibold text-rose-700 uppercase tracking-wider">Referral</th>
                    <th className="px-4 py-3 text-xs font-semibold text-rose-700 uppercase tracking-wider">Patient</th>
                    <th className="px-4 py-3 text-xs font-semibold text-rose-700 uppercase tracking-wider">Facility</th>
                    <th className="px-4 py-3 text-xs font-semibold text-rose-700 uppercase tracking-wider">Days Overdue</th>
                    <th className="px-4 py-3 text-xs font-semibold text-rose-700 uppercase tracking-wider">Missing Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueReferrals.slice(0, 5).map((row) => (
                    <tr key={row.referral_number} className="hover:bg-rose-50/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-rose-600">
                        {row.referral_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">{row.patient_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.facility_name}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-rose-600">{row.days_overdue}d</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.missing_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter>
            <span className="text-xs text-slate-500">
              Showing {Math.min(5, overdueReferrals.length)} of {overdueReferrals.length} overdue referrals
            </span>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { FileText, Calendar, AlertCircle, CheckCircle, Clock, Activity, TrendingUp, Shield } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Alert from '../../components/ui/Alert'
import { ReferralListClient, SupervisorClient } from '../../services/referralsService'
import StatCard from '../../components/layout/StatCard'
import { Link, useNavigate } from 'react-router-dom'

export default function PHDashboard() {
  const navigate = useNavigate()
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const pendingReferrals = referrals.filter(r => r.status === 'pending_ack')
  const closedCount = referrals.filter(r => r.status === 'closed').length
  const closureRate = referrals.length ? Math.round((closedCount / referrals.length) * 100) : 0

  const stats = [
    { label: 'Referrals Issued', value: referrals.length.toString(), delta: 0 },
    { label: 'Awaiting Acknowledgement', value: pendingReferrals.length.toString(), delta: 0 },
    { label: 'Follow-up Required', value: referrals.filter(r => r.follow_up_required && r.status !== 'closed').length.toString(), delta: 0 },
    { label: 'Closed Loop Completion', value: `${closureRate}%`, delta: 0 },
  ]

  const columns = [
    { key: 'patient_name', label: 'Patient' },
    { key: 'referral_number', label: 'Referral ID', render: (row) => (
      <Link 
        to={`/referrals/${row.id}`}
        className="font-mono text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
      >
        #{row.referral_number?.slice(-6) || row.id?.slice(-6)}
      </Link>
    )},
    { key: 'receiving_facility_name', label: 'Receiving Facility' },
    { key: 'specialty', label: 'Specialty Required' },
    { key: 'created_at', label: 'Created', render: (row) => new Date(row.created_at).toLocaleDateString() },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'pending_ack' ? 'warning' : 'info'}>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ReferralListClient.list()
      setReferrals(data || [])
    } catch (err) {
      setError('Failed to load referrals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReferral = () => {
    navigate('/referrals/new')
  }

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 mb-4">
        <FileText className="h-8 w-8 text-teal-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No pending referrals</h3>
      <p className="text-slate-500 max-w-sm mb-6">All referrals have been processed or are not yet acknowledged.</p>
      <Button onClick={handleCreateReferral}>
        Create New Referral
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">PHC Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor all outgoing referrals and follow-up tasks for your facility
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.delta}
            icon={CheckCircle}
            variant="teal"
          />
        ))}
      </div>

      {/* Action Alerts */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Alert
          variant="warning"
          title="Referral Closure Intelligence"
          message={`${referrals.filter(r => r.status !== 'closed').length} referral${referrals.filter(r => r.status !== 'closed').length === 1 ? '' : 's'} remain open and may be blocked from closure until required actions are complete.`}
        />
        <Alert
          variant="info"
          title="Quick Actions"
          message="Create a new referral or assign a community follow-up task from the Follow-Up Workspace."
        />
      </div>

      {/* Pending Referrals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Referrals</CardTitle>
              <CardDescription>
                Referrals awaiting acknowledgement or follow-up from receiving facilities
              </CardDescription>
            </div>
            <Button onClick={handleCreateReferral}>
              Create Referral
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-200/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pendingReferrals.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Referral ID</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Receiving Facility</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Specialty</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingReferrals.map((row) => (
                    <tr key={row.id} className="table-row hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{row.patient_name}</div>
                        <div className="text-xs text-slate-400">
                          {row.patient_age ? `${row.patient_age} years` : 'Age not provided'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link 
                          to={`/referrals/${row.id}`}
                          className="font-mono text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          {row.referral_number || row.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.receiving_facility_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.specialty}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(row.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="warning">
                          {row.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
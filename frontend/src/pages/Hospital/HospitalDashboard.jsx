import React, { useState, useEffect } from 'react'
import { 
  FileText, Calendar, AlertCircle, CheckCircle, Clock, UserPlus, 
  ClipboardCheck, Stethoscope, Shield, PlusCircle, TrendingUp, Activity 
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Alert from '../../components/ui/Alert'
import { ReferralListClient, HospitalClient } from '../../services/referralsService'
import StatCard from '../../components/layout/StatCard'
import { useToast } from '../../components/ui/Toast'
import { Link, useNavigate } from 'react-router-dom'

export default function HospitalDashboard() {
  const navigate = useNavigate()
  const toast = useToast()
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const pendingReferrals = referrals.filter(r => r.status === 'pending_ack')

  const stats = [
    { label: 'Incoming Referrals', value: referrals.length },
    { label: 'Pending Acknowledgement', value: pendingReferrals.length },
    { label: 'In Treatment', value: referrals.filter(r => ['acknowledged', 'arrived'].includes(r.status)).length },
    { label: 'Outcomes Recorded', value: referrals.filter(r => r.status === 'outcome_recorded').length },
  ]

  const columns = [
    { key: 'patient_name', label: 'Patient' },
    { key: 'referral_number', label: 'Referral ID', render: (row) => (
      <Link 
        to={`/referrals/${row.id}`}
        className="font-mono text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
      >
        {row.referral_number || row.id}
      </Link>
    )},
    { key: 'created_at', label: 'Date', render: (row) => new Date(row.created_at).toLocaleDateString() },
    { key: 'specialty', label: 'Specialty Required' },
    { key: 'urgency', label: 'Urgency', render: (row) => {
      const urgencyLevel = row.urgency || 'routine'
      const configs = {
        emergency: { label: 'Emergency', color: 'danger' },
        urgent: { label: 'Urgent', color: 'warning' },
        routine: { label: 'Routine', color: 'info' },
      }
      const config = configs[urgencyLevel] || configs.routine
      return <Badge variant={config.color}>{config.label}</Badge>
    }},
    { key: 'status', label: 'Status' },
  ]

  useEffect(() => {
    fetchReferrals()
  }, [])

  const fetchReferrals = async () => {
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

  const handleAcknowledge = async (refId) => {
    try {
      await HospitalClient.acknowledge(refId)
      toast.success('Referral acknowledged.')
      fetchReferrals()
    } catch (err) {
      toast.error('Failed to acknowledge referral.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage incoming referrals, patient arrivals, and treatment outcomes
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value.toString()}
            change={0}
            icon={ClipboardCheck}
            variant="teal"
          />
        ))}
      </div>

      {/* Action Alerts */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Alert
          variant="info"
          title="Queue Summary"
          message={`${pendingReferrals.length} referral${pendingReferrals.length === 1 ? '' : 's'} awaiting acknowledgement and patient intake.`}
        />
        <Alert
          variant="warning"
          title="Back-Referral Tracking"
          message="Referrals with a required back-referral remain open until the receiving facility submits its report."
        />
      </div>

      {/* Incoming Referrals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Incoming Referrals</CardTitle>
              <CardDescription>
                Referrals awaiting acknowledgement and patient intake
              </CardDescription>
            </div>
            <Link to="/referrals">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                View Full Queue
              </Button>
            </Link>
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
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 mb-4">
                <FileText className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No pending referrals</h3>
              <p className="text-slate-500 max-w-sm mb-4">All incoming referrals have been processed or are not yet acknowledged.</p>
              <Button onClick={() => navigate('/referrals')}>
                View full referral list
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Referral</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Specialty</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgency</th>
                    <th className="px-4 py-3"></th>
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
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(row.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {row.specialty?.replace(/_/g, ' ') || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const urgency = row.urgency || 'routine'
                          const configs = {
                            emergency: { label: 'Emergency', color: 'danger' },
                            urgent: { label: 'Urgent', color: 'warning' },
                            routine: { label: 'Routine', color: 'info' },
                          }
                          const config = configs[urgency]
                          return <Badge variant={config.color}>{config.label}</Badge>
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handleAcknowledge(row.id)}
                          >
                            Acknowledge
                          </Button>
                          <Link to={`/hospital/arrival/${row.id}`}>
                            <Button size="sm">
                              Patient Arrival
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-slate-500">
            New referrals appear here automatically from PHC facilities
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
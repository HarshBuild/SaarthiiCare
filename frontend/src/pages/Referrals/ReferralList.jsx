import React, { useState, useEffect } from 'react'
import { FileText, Calendar, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal, PlusCircle, TrendingUp } from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Alert from '../../components/ui/Alert'
import { ReferralListClient } from '../../services/referralsService'

export default function ReferralList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  const statusColors = {
    draft: 'default',
    issued: 'info',
    pending_ack: 'warning',
    acknowledged: 'info',
    arrived: 'teal',
    outcome_recorded: 'success',
    back_referral_pending: 'warning',
    back_referral_completed: 'success',
    follow_up_pending: 'warning',
    follow_up_completed: 'success',
    closed: 'success',
    rejected: 'danger',
    cancelled: 'default',
  }

  const statusLabels = {
    draft: 'Draft',
    issued: 'Issued',
    pending_ack: 'Pending Ack',
    acknowledged: 'Acknowledged',
    arrived: 'Arrived',
    outcome_recorded: 'Outcome Recorded',
    back_referral_pending: 'Back Ref Pending',
    back_referral_completed: 'Back Ref Complete',
    follow_up_pending: 'Follow-up Pending',
    follow_up_completed: 'Follow-up Complete',
    closed: 'Closed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams(searchTerm ? { search: searchTerm } : {})
    fetchReferrals()
  }

  const handleRefresh = () => {
    fetchReferrals()
  }

  const fetchReferrals = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ReferralListClient.list({ search: searchTerm })
      setReferrals(data || [])
    } catch (err) {
      setError('Failed to load referrals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReferrals()
  }, [])

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '')
  }, [searchParams])

  const filteredReferrals = referrals.filter(ref => 
    ref.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.referral_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = [
    { label: 'Total Referrals', value: referrals.length, change: 0 },
    { label: 'Pending Ack', value: referrals.filter(r => r.status === 'pending_ack').length, change: 0 },
    { label: 'In Progress', value: referrals.filter(r => ['acknowledged', 'arrived'].includes(r.status)).length, change: 0 },
    { label: 'Closed', value: referrals.filter(r => r.status === 'closed').length, change: 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Referrals</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage all patient referrals across your facility
          </p>
        </div>
        <Link to="/referrals/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Referral
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="hover:shadow-md transition-shadow" hoverable>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name or referral ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </form>

      {error && (
        <Alert variant="danger" title="Error" message={error} />
      )}

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>
                {filteredReferrals.length} of {referrals.length} referrals
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-200/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 mb-4">
                <FileText className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No referrals found</h3>
              <p className="text-slate-500 max-w-sm mb-6">Create a new referral to get started.</p>
              <Button onClick={() => navigate('/referrals/new')}>
                Create Referral
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Referral</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Specialty</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Facility</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReferrals.map((row) => (
                    <tr key={row.id} className="table-row hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <Link 
                          to={`/referrals/${row.id}`}
                          className="font-mono text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          {row.referral_number || row.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{row.patient_name}</div>
                        <div className="text-xs text-slate-400">
                          {row.patient_age ? `${row.patient_age}y` : 'Age not provided'}
                          {row.patient_gender ? ` • ${row.patient_gender.charAt(0).toUpperCase()}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {row.specialty?.replace(/_/g, ' ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {row.receiving_facility_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(row.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColors[row.status] || 'default'}>
                          {statusLabels[row.status] || row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/referrals/${row.id}`}>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </Link>
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
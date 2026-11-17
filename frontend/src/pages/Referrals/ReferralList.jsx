import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  PlusCircle,
  AlertCircle,
  Inbox,
  Filter,
} from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { ReferralListClient } from '../../services/referralsService'
import { getStatusMeta } from '../../utils/referralStatus'
import {
  STATUS_FILTERS,
  filterReferrals,
  paginate,
  summariseReferrals,
} from '../../utils/referralQuery'

const PAGE_SIZE = 10

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN')
}

export default function ReferralList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const fetchReferrals = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ReferralListClient.list()
      setReferrals(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load referrals. Please check the connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReferrals()
  }, [fetchReferrals])

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '')
    setAppliedSearch(searchParams.get('search') || '')
    setPage(1)
  }, [searchParams])

  const summary = useMemo(() => summariseReferrals(referrals), [referrals])
  const filtered = useMemo(
    () => filterReferrals(referrals, { search: appliedSearch, status: statusFilter }),
    [referrals, appliedSearch, statusFilter],
  )
  const paged = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page])

  const submitSearch = (event) => {
    event.preventDefault()
    const term = searchTerm.trim()
    setAppliedSearch(term)
    setPage(1)
    setSearchParams(term ? { search: term } : {}, { replace: true })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setStatusFilter('all')
    setPage(1)
    setSearchParams({}, { replace: true })
  }

  const stats = [
    { label: 'Referrals', value: summary.total, tone: 'text-slate-900' },
    { label: 'Open', value: summary.open, tone: 'text-sky-700' },
    { label: 'Awaiting acknowledgement', value: summary.awaiting, tone: 'text-amber-700' },
    { label: 'Closed', value: summary.closed, tone: 'text-emerald-700' },
  ]

  const noData = !loading && !error && referrals.length === 0
  const noMatches = !loading && !error && referrals.length > 0 && filtered.length === 0
  const hasFilters = Boolean(appliedSearch) || statusFilter !== 'all'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Referrals</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every referral for your facility, with live workflow status.
          </p>
        </div>
        <Button onClick={() => navigate('/referrals/new')}>
          <PlusCircle className="h-4 w-4" />
          New referral
        </Button>
      </div>

      {error && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Alert variant="danger" title="Could not load referrals" message={error} className="flex-1" />
          <Button variant="outline" size="sm" onClick={fetchReferrals}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} hoverable>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>
              <p className={`mt-1 text-2xl font-bold ${stat.tone}`}>
                {loading ? '…' : stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Referral register</CardTitle>
              <CardDescription>
                {loading
                  ? 'Loading referrals…'
                  : `${filtered.length} of ${referrals.length} referrals`}
              </CardDescription>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <form onSubmit={submitSearch} className="flex gap-2" role="search">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    aria-label="Search referrals"
                    placeholder="Patient, referral no. or specialty"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:w-64"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  aria-label="Apply search"
                >
                  Search
                </Button>
              </form>

              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value)
                    setPage(1)
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:w-52"
                >
                  {STATUS_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fetchReferrals}
                aria-label="Refresh referrals"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="space-y-3 px-6 pb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-rose-400" />
              <p className="text-sm text-slate-600">The referral register is unavailable.</p>
              <Button variant="outline" size="sm" onClick={fetchReferrals}>
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            </div>
          ) : noData ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
                <Inbox className="h-7 w-7 text-teal-600" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">No referrals yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Create the first referral to start the closed loop.
                </p>
              </div>
              <Button size="sm" onClick={() => navigate('/referrals/new')}>
                <PlusCircle className="h-4 w-4" />
                Create referral
              </Button>
            </div>
          ) : noMatches ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Search className="h-7 w-7 text-slate-400" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">No matching referrals</p>
                <p className="mt-1 text-sm text-slate-500">
                  Try a different search term or status filter.
                </p>
              </div>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50/80">
                      {['Referral', 'Patient', 'Specialty', 'Receiving facility', 'Created', 'Status', ''].map(
                        (heading) => (
                          <th
                            key={heading}
                            className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paged.items.map((row) => {
                      const meta = getStatusMeta(row.status)
                      return (
                        <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <Link
                              to={`/referrals/${row.id}`}
                              className="font-mono text-xs font-medium text-teal-600 hover:text-teal-700"
                            >
                              {row.referral_number || row.id}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-900">{row.patient_name}</p>
                            <p className="text-xs text-slate-400">
                              {row.patient_age ? `${row.patient_age}y` : 'Age not recorded'}
                              {row.patient_gender
                                ? ` · ${row.patient_gender.charAt(0).toUpperCase()}`
                                : ''}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm capitalize text-slate-600">
                            {row.specialty?.replace(/_/g, ' ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {row.receiving_facility_name || '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                            {formatDate(row.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={meta.variant} size="sm">
                              {meta.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link to={`/referrals/${row.id}`} aria-label={`Open ${row.referral_number || row.id}`}>
                              <Button size="sm" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-3 sm:flex-row">
                <p className="text-xs text-slate-500">
                  Showing {paged.from}–{paged.to} of {paged.total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paged.page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-2 text-xs font-medium text-slate-600">
                    Page {paged.page} of {paged.pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paged.page >= paged.pageCount}
                    onClick={() => setPage((current) => Math.min(paged.pageCount, current + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

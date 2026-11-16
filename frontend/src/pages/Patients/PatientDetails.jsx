import React, { useEffect, useMemo, useState } from 'react'
import { Users, UserCheck, FileText, CheckCircle2, Search, Download, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import StatCard from '../../components/layout/StatCard'
import { useToast } from '../../components/ui/Toast'
import { ReferralListClient } from '../../services/referralsService'

const CLOSED_STATUSES = ['closed', 'cancelled', 'rejected']

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
}

export default function PatientDetails() {
  const toast = useToast()
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchReferrals = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await ReferralListClient.list()
        setReferrals(Array.isArray(data) ? data : [])
      } catch (err) {
        setError('Failed to load patient records. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()
  }, [])

  const patients = useMemo(() => {
    const grouped = new Map()

    referrals.forEach((referral) => {
      const key = referral.patient_name || `Referral ${referral.id}`
      const existing = grouped.get(key) || {
        name: key,
        referrals: [],
      }
      existing.referrals.push(referral)
      grouped.set(key, existing)
    })

    return Array.from(grouped.values())
      .map((patient) => {
        const sorted = [...patient.referrals].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
        const active = patient.referrals.filter((r) => !CLOSED_STATUSES.includes(r.status))
        return {
          name: patient.name,
          referralCount: patient.referrals.length,
          activeCount: active.length,
          latest: sorted[0],
          specialty: sorted[0]?.specialty,
          lastReferral: sorted[0]?.created_at,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [referrals])

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = [
    { label: 'Total Patients', value: patients.length, icon: Users, variant: 'teal' },
    { label: 'Active Referrals', value: patients.reduce((sum, p) => sum + p.activeCount, 0), icon: FileText, variant: 'info' },
    { label: 'With Closed Loops', value: patients.filter((p) => p.activeCount === 0).length, icon: CheckCircle2, variant: 'success' },
    { label: 'Total Referrals', value: referrals.length, icon: UserCheck, variant: 'warning' },
  ]

  const handleExport = () => {
    if (filteredPatients.length === 0) {
      toast.info('There are no patient records to export.')
      return
    }

    const rows = [
      ['Patient', 'Referrals', 'Active Referrals', 'Latest Specialty', 'Last Referral'],
      ...filteredPatients.map((patient) => [
        patient.name,
        patient.referralCount,
        patient.activeCount,
        patient.specialty || '',
        formatDate(patient.lastReferral),
      ]),
    ]

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'saarthii-patients.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Patient list exported as CSV.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Records</h1>
          <p className="mt-1 text-sm text-slate-500">
            Patients derived from referral activity across your facility
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value.toString()}
            change={0}
            icon={stat.icon}
            variant={stat.variant}
          />
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search by patient or specialty..."
          aria-label="Search patients"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <Alert variant="danger" title="Error" message={error} />}

      <Card>
        <CardHeader>
          <CardTitle>Patient Directory</CardTitle>
          <CardDescription>
            {filteredPatients.length} of {patients.length} patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-200/60" />
              ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                <Users className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">No patients found</h3>
              <p className="mx-auto max-w-sm text-slate-500">
                {searchTerm
                  ? 'No patients match your search criteria.'
                  : 'Patient records appear automatically once referrals are created.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Patient</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Referrals</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Active</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Latest Specialty</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Last Referral</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.name} className="table-row transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{patient.name}</div>
                        <div className="text-xs text-slate-400">{patient.referralCount} referral{patient.referralCount === 1 ? '' : 's'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{patient.referralCount}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{patient.activeCount}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {patient.specialty?.replace(/_/g, ' ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(patient.lastReferral)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={patient.activeCount > 0 ? 'teal' : 'default'}>
                          {patient.activeCount > 0 ? 'Active Care' : 'Closed Loop'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {patient.latest?.id && (
                          <Link
                            to={`/referrals/${patient.latest.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 transition-colors hover:text-teal-700"
                          >
                            View
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
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

import React, { useEffect, useMemo, useState } from 'react'
import {
  ClipboardCheck,
  Clock,
  Activity,
  AlertCircle,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  CalendarDays,
  UserRound,
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import StatCard from '../../components/layout/StatCard'
import { useToast } from '../../components/ui/Toast'
import { FollowUpClient, ReferralListClient } from '../../services/referralsService'

const STATUS_STYLES = {
  pending: { color: 'warning', label: 'Pending' },
  in_progress: { color: 'info', label: 'In Progress' },
  completed: { color: 'success', label: 'Completed' },
  overdue: { color: 'danger', label: 'Overdue' },
}

const TASK_TYPES = {
  home_visit: 'Home Visit',
  phone_call: 'Phone Call',
  lab_results: 'Lab Results Check',
  medication: 'Medication Follow-up',
  referral: 'Referral Follow-up',
}

const ASSIGNEE_LABELS = {
  'user-1': 'Dr. Priya Sharma',
  'user-2': 'Ravi Kumar',
  'user-3': 'Dr. Anjali Reddy',
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
}

function isOverdue(task) {
  if (!task?.due_date || task.status === 'completed') return false
  const due = new Date(task.due_date)
  if (Number.isNaN(due.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return task.status === 'overdue' || due < today
}

export default function FollowUpWorkspace() {
  const toast = useToast()
  const [followUps, setFollowUps] = useState([])
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [completingId, setCompletingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    referral_id: '',
    assigned_to_user_id: 'user-1',
    task_description: '',
    due_date: '',
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [tasks, referralList] = await Promise.all([
        FollowUpClient.list(),
        ReferralListClient.list(),
      ])
      setFollowUps(Array.isArray(tasks) ? tasks : [])
      setReferrals(Array.isArray(referralList) ? referralList : [])
    } catch (err) {
      setError('Failed to load follow-up tasks. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const referralLookup = useMemo(() => {
    const lookup = {}
    referrals.forEach((referral) => {
      if (referral.id) lookup[referral.id] = referral
      if (referral.referral_number) lookup[referral.referral_number] = referral
    })
    return lookup
  }, [referrals])

  const enrichedTasks = useMemo(() => followUps.map((task) => {
    const referral = referralLookup[task.referral_id]
    return {
      ...task,
      patient_name: referral?.patient_name || 'Patient',
      referral_label: referral?.referral_number || task.referral_id,
      overdue: isOverdue(task),
    }
  }), [followUps, referralLookup])

  const filteredTasks = enrichedTasks.filter((task) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      task.patient_name?.toLowerCase().includes(term) ||
      task.referral_label?.toLowerCase().includes(term) ||
      task.task_description?.toLowerCase().includes(term)
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'overdue' ? task.overdue : task.status === filterStatus && !task.overdue)
    return matchesSearch && matchesFilter
  })

  const stats = [
    { label: 'Total Tasks', value: enrichedTasks.length, icon: ClipboardCheck, variant: 'teal' },
    { label: 'Pending', value: enrichedTasks.filter((t) => t.status === 'pending' && !t.overdue).length, icon: Clock, variant: 'warning' },
    { label: 'Completed', value: enrichedTasks.filter((t) => t.status === 'completed').length, icon: CheckCircle2, variant: 'success' },
    { label: 'Overdue', value: enrichedTasks.filter((t) => t.overdue).length, icon: AlertCircle, variant: 'danger' },
  ]

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' },
  ]

  const referralOptions = referrals.map((referral) => ({
    value: referral.id,
    label: `${referral.referral_number || referral.id} — ${referral.patient_name || 'Patient'}`,
  }))

  const openCreateModal = () => {
    setFormData({
      referral_id: referrals[0]?.id || '',
      assigned_to_user_id: 'user-1',
      task_description: '',
      due_date: '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleCreate = async () => {
    if (!formData.referral_id || !formData.task_description || !formData.due_date) {
      setFormError('Referral, task description, and due date are required.')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      await FollowUpClient.create(formData)
      toast.success('Follow-up task assigned successfully.')
      setModalOpen(false)
      await fetchData()
    } catch (err) {
      setFormError('Unable to create the follow-up task. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async (task) => {
    setCompletingId(task.id)
    try {
      await FollowUpClient.update(task.id, { completion_notes: 'Marked completed from follow-up workspace' })
      toast.success('Task marked as completed.')
      await fetchData()
    } catch (err) {
      toast.error('Unable to update this task. Please try again.')
    } finally {
      setCompletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Follow-Up Workspace</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track community follow-up tasks and close the loop on patient care
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Assign Task
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by patient, referral, or task..."
            aria-label="Search follow-up tasks"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={statusOptions}
          aria-label="Filter by status"
          className="sm:w-48"
        />
        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
          <Filter className="h-4 w-4" />
          {filteredTasks.length} of {enrichedTasks.length} tasks
        </div>
      </div>

      {error && <Alert variant="danger" title="Error" message={error} />}

      <Card>
        <CardHeader>
          <CardTitle>Follow-Up Tasks</CardTitle>
          <CardDescription>Tasks assigned to community health workers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-200/60" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                <ClipboardCheck className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">No follow-up tasks</h3>
              <p className="mx-auto mb-4 max-w-sm text-slate-500">
                {searchTerm || filterStatus !== 'all'
                  ? 'No tasks match your search or filter criteria.'
                  : 'Assign a task to start tracking community follow-up care.'}
              </p>
              <Button onClick={openCreateModal}>Assign First Task</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Task</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Referral</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned To</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Due Date</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => {
                    const statusKey = task.overdue ? 'overdue' : task.status
                    const status = STATUS_STYLES[statusKey] || { color: 'default', label: task.status }

                    return (
                      <tr key={task.id} className="table-row transition-colors hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900">{task.task_description}</div>
                          <div className="text-xs text-slate-400">{task.patient_name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-teal-600">{task.referral_label}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {ASSIGNEE_LABELS[task.assigned_to_user_id] || task.assigned_to_user_id}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-1.5 text-sm ${task.overdue ? 'font-medium text-rose-600' : 'text-slate-600'}`}>
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(task.due_date)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={status.color}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {task.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Done
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              loading={completingId === task.id}
                              onClick={() => handleComplete(task)}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Assign Follow-Up Task"
        description="Create a task for a community health worker to close the referral loop."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={submitting}>
              Assign Task
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger" title="Missing details" message={formError} />}

          <Select
            label="Referral"
            placeholder="Select a referral"
            options={referralOptions}
            value={formData.referral_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, referral_id: e.target.value }))}
            required
          />

          <Select
            label="Assign To"
            options={[
              { value: 'user-1', label: 'Dr. Priya Sharma' },
              { value: 'user-2', label: 'Ravi Kumar' },
              { value: 'user-3', label: 'Dr. Anjali Reddy' },
            ]}
            value={formData.assigned_to_user_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, assigned_to_user_id: e.target.value }))}
          />

          <div>
            <label htmlFor="task-description" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Task Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              required
              value={formData.task_description}
              onChange={(e) => setFormData((prev) => ({ ...prev, task_description: e.target.value }))}
              placeholder="e.g. Verify patient medication compliance"
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <Input
            label="Due Date"
            type="date"
            required
            value={formData.due_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
            icon={CalendarDays}
          />
        </div>
      </Modal>
    </div>
  )
}

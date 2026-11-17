/**
 * Pure helpers behind the appointments diary: month grid, day grouping,
 * life-cycle filters and summary counts. Kept free of React so the calendar
 * behaviour can be unit tested.
 */

export const APPOINTMENT_STATUS_META = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'default' },
  overdue: { label: 'Overdue', variant: 'warning' },
  no_show: { label: 'No show', variant: 'danger' },
}

export function getAppointmentStatusMeta(status) {
  if (APPOINTMENT_STATUS_META[status]) return APPOINTMENT_STATUS_META[status]
  return {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    variant: 'default',
  }
}

/** Local YYYY-MM-DD key. Using local time avoids a UTC day shift near midnight. */
export function toDateKey(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfDay(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return new Date(NaN)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * A scheduled appointment only becomes "overdue" once its whole day has
 * passed, so an early-morning slot is not flagged before the clinic opens.
 */
export function effectiveStatus(appointment, now = new Date()) {
  const status = appointment?.status || 'scheduled'
  if (status !== 'scheduled') return status
  const slot = new Date(appointment?.scheduled_for)
  if (Number.isNaN(slot.getTime())) return status
  if (slot < startOfDay(now)) return 'overdue'
  return 'scheduled'
}

export function summariseAppointments(appointments = [], now = new Date()) {
  const todayKey = toDateKey(now)
  const summary = {
    total: appointments.length,
    today: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
    cancelled: 0,
  }

  appointments.forEach((appointment) => {
    if (toDateKey(appointment.scheduled_for) === todayKey) summary.today += 1
    const state = effectiveStatus(appointment, now)
    if (state === 'overdue') summary.overdue += 1
    if (state === 'completed') summary.completed += 1
    if (state === 'cancelled') summary.cancelled += 1
    if (
      state === 'scheduled' &&
      new Date(appointment.scheduled_for).getTime() >= now.getTime()
    ) {
      summary.upcoming += 1
    }
  })

  return summary
}

export function groupAppointmentsByDate(appointments = []) {
  const grouped = {}
  ;[...appointments]
    .sort(
      (a, b) =>
        new Date(a.scheduled_for || 0).getTime() - new Date(b.scheduled_for || 0).getTime(),
    )
    .forEach((appointment) => {
      const key = toDateKey(appointment.scheduled_for)
      if (!key) return
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(appointment)
    })
  return grouped
}

export function appointmentsForDay(appointments = [], dateKey) {
  return (groupAppointmentsByDate(appointments)[dateKey] || []).slice()
}

export function filterAppointments(
  appointments = [],
  { status = 'all', search = '' } = {},
  now = new Date(),
) {
  const term = (search || '').trim().toLowerCase()
  const todayKey = toDateKey(now)

  return appointments.filter((appointment) => {
    if (status === 'today') {
      if (toDateKey(appointment.scheduled_for) !== todayKey) return false
    } else if (status === 'upcoming') {
      if (
        effectiveStatus(appointment, now) !== 'scheduled' ||
        new Date(appointment.scheduled_for).getTime() < now.getTime()
      ) {
        return false
      }
    } else if (status === 'overdue') {
      if (effectiveStatus(appointment, now) !== 'overdue') return false
    } else if (status && status !== 'all') {
      if (effectiveStatus(appointment, now) !== status) return false
    }

    if (!term) return true
    const haystack = [
      appointment.patient_name,
      appointment.referral_number,
      appointment.referral_id,
      appointment.location,
      appointment.notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(term)
  })
}

/** Six-week, Sunday-first grid used by the month calendar. */
export function buildMonthGrid(year, monthIndex, { today = new Date() } = {}) {
  const firstOfMonth = new Date(year, monthIndex, 1)
  const start = new Date(year, monthIndex, 1 - firstOfMonth.getDay())
  const todayKey = toDateKey(today)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    const key = toDateKey(date)
    return {
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
      isToday: key === todayKey,
    }
  })
}

export function formatAppointmentTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time not set'
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function formatAppointmentDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date not set'
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Value for a datetime-local input, in local time. */
export function toDateTimeLocalValue(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

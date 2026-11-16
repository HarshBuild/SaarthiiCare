import React from 'react'
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'

/**
 * Alert Component - Contextual feedback message
 * Variants: success, warning, error, info
 * Dismissible with close button
 */
export default function Alert({
  variant = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  className = '',
  children,
  ...props
}) {
  const [visible, setVisible] = React.useState(true)

  if (!visible) return null

  const config = {
    success: {
      bg: 'bg-emerald-50/80',
      border: 'border-emerald-200/60',
      text: 'text-emerald-900',
      description: 'text-emerald-700',
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
    },
    warning: {
      bg: 'bg-amber-50/80',
      border: 'border-amber-200/60',
      text: 'text-amber-900',
      description: 'text-amber-700',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    error: {
      bg: 'bg-rose-50/80',
      border: 'border-rose-200/60',
      text: 'text-rose-900',
      description: 'text-rose-700',
      icon: AlertCircle,
      iconColor: 'text-rose-500',
    },
    info: {
      bg: 'bg-sky-50/80',
      border: 'border-sky-200/60',
      text: 'text-sky-900',
      description: 'text-sky-700',
      icon: Info,
      iconColor: 'text-sky-500',
    },
  }

  const styles = config[variant] || config.info
  const Icon = styles.icon

  const handleDismiss = () => {
    setVisible(false)
    if (onDismiss) onDismiss()
  }

  return (
    <div
      className={`
        relative flex gap-3 rounded-xl border p-4 backdrop-blur-sm transition-all animate-fade-in
        ${styles.bg} ${styles.border} ${styles.text} ${className}
      `}
      role="alert"
      {...props}
    >
      <div className="shrink-0 mt-0.5">
        <Icon className={`h-5 w-5 ${styles.iconColor}`} />
      </div>
      <div className="flex-1">
        {title && <h4 className="text-sm font-semibold mb-1">{title}</h4>}
        <div className={`text-sm ${styles.description}`}>
          {message || children}
        </div>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={`shrink-0 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-black/5 transition-colors`}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 opacity-60" />
        </button>
      )}
    </div>
  )
}

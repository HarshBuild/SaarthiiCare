import React, { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

/**
 * ToastProvider - Lightweight global notifications.
 * Replaces native alert() calls with non-blocking, dismissible toasts.
 */
const ToastContext = createContext(null)

let toastId = 0

const variantStyles = {
  success: {
    icon: CheckCircle,
    ring: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: AlertCircle,
    ring: 'border-rose-200',
    iconColor: 'text-rose-600',
    bar: 'bg-rose-500',
  },
  info: {
    icon: Info,
    ring: 'border-sky-200',
    iconColor: 'text-sky-600',
    bar: 'bg-sky-500',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback((message, variant = 'success', title) => {
    const id = ++toastId
    setToasts((current) => [...current, { id, message, variant, title }])
    window.setTimeout(() => remove(id), 4500)
  }, [remove])

  const toast = {
    success: (message, title) => push(message, 'success', title),
    error: (message, title) => push(message, 'error', title),
    info: (message, title) => push(message, 'info', title),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
      >
        {toasts.map((item) => {
          const styles = variantStyles[item.variant] || variantStyles.info
          const Icon = styles.icon

          return (
            <div
              key={item.id}
              role="status"
              className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border bg-white shadow-lg shadow-slate-900/5 animate-slide-in ${styles.ring}`}
            >
              <div className="flex items-start gap-3 p-4">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.iconColor}`} />
                <div className="min-w-0 flex-1">
                  {item.title && (
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  )}
                  <p className="text-sm text-slate-600">{item.message}</p>
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className={`h-1 w-full ${styles.bar}`} />
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider')
  }
  return context
}

import React from 'react'

/**
 * Textarea Component - Multi-line text input
 * Supports label, error state, helper text, and resizable option
 */
export default function Textarea({
  label,
  error,
  helperText,
  rows = 4,
  className = '',
  id,
  ...props
}) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`
          block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900
          shadow-sm transition-colors placeholder:text-slate-400 resize-y
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${error
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
            : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500'
          }
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-danger-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  )
}
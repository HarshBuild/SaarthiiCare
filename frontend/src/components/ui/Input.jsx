import React from 'react'

/**
 * Input Component - Standard text input field
 * Supports label, error state, helper text, and icons
 */
export default function Input({
  label,
  error,
  helperText,
  icon,
  leftIcon,
  className = '',
  id,
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const Icon = icon || leftIcon

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors">
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
        <input
          id={inputId}
          className={`
            input-field
            ${Icon ? 'pl-11' : 'pl-4'}
            ${error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}
          `}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-rose-600' : 'text-slate-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}

import React from 'react'

/**
 * Select Component - Dropdown select field
 * Supports label, error state, helper text, and options array
 */
export default function Select({
  label,
  error,
  helperText,
  options = [],
  placeholder,
  className = '',
  id,
  ...props
}) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-semibold text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`
            input-field appearance-none pr-10
            ${error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-rose-600' : 'text-slate-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}

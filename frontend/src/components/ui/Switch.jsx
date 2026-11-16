import React from 'react'

/**
 * Switch Component - Toggle switch for boolean settings
 */
export default function Switch({ checked, onCheckedChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked 
          ? 'bg-teal-600 border-teal-600' 
          : 'bg-slate-200 border-slate-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}
      `}
    >
      <div 
        className={`
          transform transition-transform duration-200 inline-flex h-5 w-5 items-center justify-center
          rounded-full bg-white shadow
          ${checked ? 'translate-x-5 bg-teal-600' : 'translate-x-1'}
        `}
      >
        {checked && (
          <svg 
            className="h-3 w-3 text-teal-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
    </button>
  )
}
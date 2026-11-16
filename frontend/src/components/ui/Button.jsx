import React from 'react'

/**
 * Button Component - Primary interactive element
 * Variants: primary, secondary, danger, ghost, outline, gradient
 * Sizes: xs, sm, md, lg
 * Supports full width, disabled state, loading state, left/right icons
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  children,
  className = '',
  type = 'button',
  fullWidth = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]'

  const variantStyles = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-600/20 focus:ring-teal-500',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20 focus:ring-rose-500',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:ring-teal-500 shadow-sm',
    gradient: 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 focus:ring-teal-500',
  }

  const sizeStyles = {
    xs: 'px-2.5 py-1 text-xs gap-1.5',
    sm: 'px-3 py-1.5 text-xs gap-1.5 font-medium',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2.5 font-semibold',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variantStyles[variant] || variantStyles.primary}
        ${sizeStyles[size] || sizeStyles.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <>
          {LeftIcon && <LeftIcon className={`${size === 'xs' || size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />}
          {children}
          {RightIcon && <RightIcon className={`${size === 'xs' || size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />}
        </>
      )}
    </button>
  )
}

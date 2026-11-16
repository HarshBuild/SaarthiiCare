import React from 'react'

/**
 * Badge Component - Small status indicator / label
 * Variants: default, success, warning, danger, info, teal, navy, purple
 * Sizes: sm, md, lg
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/60',
    teal: 'bg-teal-50 text-teal-700 border border-teal-200/60',
    navy: 'bg-slate-900 text-slate-100 border border-slate-700',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/60',
  }

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    teal: 'bg-teal-500',
    navy: 'bg-slate-300',
    purple: 'bg-purple-500',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-xs font-semibold',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full whitespace-nowrap transition-colors
        ${variantStyles[variant] || variantStyles.default}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant] || 'bg-slate-400'}`} />
      )}
      {children}
    </span>
  )
}

import React from 'react'

/**
 * Card Component - Container for grouping related content
 * Supports header, body, footer sections, hover effects, and accent borders
 */
export default function Card({
  children,
  className = '',
  hoverable = false,
  padding = 'md',
  accent = false,
  glass = false,
  ...props
}) {
  const paddingStyles = {
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-6',
    none: 'p-0',
  }

  return (
    <div
      className={`
        overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200
        ${hoverable ? 'hover:shadow-md hover:border-slate-300 card-hover-effect cursor-pointer' : ''}
        ${accent ? 'border-t-4 border-t-teal-600' : ''}
        ${glass ? 'glass-panel' : ''}
        ${paddingStyles[padding] || paddingStyles.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * CardHeader Component - Top section of a card with title and actions
 */
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between border-b border-slate-100 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  )
}

/**
 * CardTitle Component - Main card header text
 */
export function CardTitle({ children, className = '', icon: Icon }) {
  return (
    <h3 className={`text-base font-semibold text-slate-900 flex items-center gap-2 ${className}`}>
      {Icon && <Icon className="h-5 w-5 text-teal-600" />}
      {children}
    </h3>
  )
}

/**
 * CardDescription Component - Secondary subtitle text
 */
export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-xs text-slate-500 mt-0.5 ${className}`}>
      {children}
    </p>
  )
}

/**
 * CardContent Component - Main body content area
 */
export function CardContent({ children, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  )
}

/**
 * CardFooter Component - Bottom action area of card
 */
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between border-t border-slate-100 pt-4 mt-5 ${className}`}>
      {children}
    </div>
  )
}

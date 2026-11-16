import React, { cloneElement } from 'react'

/**
 * Tabs Component - Tabbed navigation interface
 * Supports controlled and uncontrolled usage
 */
export default function Tabs({
  tabs = [],
  activeIndex = 0,
  onTabChange,
  className = '',
  ...props
}) {
  return (
    <div className={className} {...props}>
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1" aria-label="Tabs">
          {tabs.map((tab, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={tab.id || index}
                onClick={() => onTabChange && onTabChange(index)}
                className={`
                  group inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                {tab.icon && (
                  <span className={isActive ? 'text-teal-500' : 'text-slate-400'}>
                    {cloneElement(tab.icon, { className: 'h-4 w-4' })}
                  </span>
                )}
                {tab.label}
                {tab.badge !== undefined && (
                  <span className={`
                    ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${isActive ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'}
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
      <div className="mt-4">
        {tabs[activeIndex]?.content}
      </div>
    </div>
  )
}
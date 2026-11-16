import React from 'react'

/**
 * Table Component - Data display grid
 * Supports headers, body, striped rows, and hover effects
 */
export default function Table({
  headers = [],
  children,
  className = '',
  striped = false,
  ...props
}) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200/80 bg-white ${className}`}>
      <table className="w-full text-left border-collapse" {...props}>
        <thead>
          <tr className="bg-slate-50/80">
            {headers.map((header, index) => (
              <th
                key={index}
                className="table-header first:rounded-tl-xl last:rounded-tr-xl"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {children}
        </tbody>
      </table>
    </div>
  )
}

/**
 * TableRow Component - Single row in a table
 */
export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`
        table-row
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </tr>
  )
}

/**
 * TableCell Component - Single cell in a table row
 */
export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 py-4 text-sm text-slate-700 ${className}`}>
      {children}
    </td>
  )
}

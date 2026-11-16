import React from 'react'
import { FileText, Users, Activity, BarChart3 } from 'lucide-react'

export default function Placeholder({ title }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          This page is under active development for the SAARTHII v1.0 MVP release.
        </p>
      </div>

      <div className="max-w-md">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Page Under Construction</h3>
          <p className="text-sm text-slate-500 mb-4">
            {title} functionality is being developed as part of the core SAARTHII workflow engine.
          </p>
          <p className="text-xs text-slate-400">
            Next milestone: Full role-based dashboard implementation with live data.
          </p>
        </div>
      </div>
    </div>
  )
}
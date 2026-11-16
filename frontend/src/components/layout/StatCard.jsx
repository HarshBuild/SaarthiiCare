import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

/**
 * StatCard - Modern metric card for dashboards
 */
export default function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
  loading = false,
}) {
  const hasTrend = typeof change === 'number' && change !== 0

  const getTrend = () => {
    if (change > 0) return { icon: TrendingUp, color: 'success', text: `+${change}` }
    if (change < 0) return { icon: TrendingDown, color: 'danger', text: change }
    return { icon: Minus, color: 'default', text: '0' }
  }

  const trend = getTrend()
  const TrendIcon = trend.icon

  return (
    <Card className="relative overflow-hidden group hover:border-teal-300" hoverable>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {label}
          </p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            {loading ? '...' : value}
          </h2>
          
          {hasTrend && (
            <div className="flex items-center gap-2 pt-1">
              <Badge variant={trend.color} size="sm" className="gap-0.5">
                <TrendIcon size={12} strokeWidth={3} />
                {trend.text}%
              </Badge>
              {changeLabel && (
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className="p-3 rounded-2xl bg-slate-50 text-teal-600 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors duration-200 shadow-sm border border-slate-100 group-hover:border-teal-100">
            <Icon size={24} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Decorative background glow */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-colors" />
    </Card>
  )
}

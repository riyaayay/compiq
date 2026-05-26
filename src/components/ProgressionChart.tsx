'use client'
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts'

type Level = {
  levelCode: string; levelDisplay: string
  medianTC: number; p25TC: number; p75TC: number
  medianBase: number; medianBonus: number; medianEsop: number
}

export default function ProgressionChart({ data }: { data: Level[] }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-400 text-sm">No progression data available.</p>
  }

  const chartData = data.map(l => ({
    level:  l.levelCode,
    'Median TC':   l.medianTC,
    'Base':        l.medianBase,
    'Bonus':       l.medianBonus,
    'ESOP':        l.medianEsop,
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-3">Total compensation growth across levels (₹L)</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="level" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => [`₹${v}L`, '']} />
            <Legend />
            <Area type="monotone" dataKey="Median TC" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-3">Compensation breakdown by component (₹L)</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="level" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => [`₹${v}L`, '']} />
            <Legend />
            <Area type="monotone" dataKey="Base"  stroke="#64748b" fill="#f1f5f9" strokeWidth={1.5} stackId="1" />
            <Area type="monotone" dataKey="Bonus" stroke="#16a34a" fill="#dcfce7" strokeWidth={1.5} stackId="1" />
            <Area type="monotone" dataKey="ESOP"  stroke="#2563eb" fill="#dbeafe" strokeWidth={1.5} stackId="1" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect, useCallback } from 'react'

type Salary = {
  id: string; company: string; companySlug: string; tier: string
  role: string; level: string; levelDisplay: string; city: string
  baseSalary: number; bonus: number; esop: number; totalComp: number
  yoe: number; isVerified: boolean; submittedAt: string
}

type Filters = {
  companies: { name: string; slug: string }[]
  cities:    { name: string }[]
  levels:    { code: string; displayName: string }[]
}

const TIER_COLORS: Record<string, string> = {
  FAANG:           'bg-purple-100 text-purple-700',
  PRODUCT_STARTUP: 'bg-blue-100 text-blue-700',
  MNC:             'bg-green-100 text-green-700',
  IT_SERVICES:     'bg-gray-100 text-gray-600',
}

export default function SalaryExplorer({ filters }: { filters: Filters }) {
  const [salaries, setSalaries]   = useState<Salary[]>([])
  const [loading, setLoading]     = useState(true)
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [company, setCompany]     = useState('')
  const [level, setLevel]         = useState('')
  const [city, setCity]           = useState('')
  const [sortBy, setSortBy]       = useState<'totalComp' | 'baseSalary'>('totalComp')

  const fetchSalaries = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page:   String(page),
      limit:  '20',
      sortBy,
      sortOrder: 'desc',
    })
    if (company) params.set('company', company)
    if (level)   params.set('level',   level)
    if (city)    params.set('city',    city)

    const res  = await fetch(`/api/salaries?${params}`)
    const json = await res.json()
    setSalaries(json.data || [])
    setTotal(json.pagination?.total || 0)
    setLoading(false)
  }, [page, company, level, city, sortBy])

  useEffect(() => { fetchSalaries() }, [fetchSalaries])

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
        <select value={company} onChange={e => { setCompany(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[150px]">
          <option value="">All Companies</option>
          {filters.companies.map(c => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select value={level} onChange={e => { setLevel(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[120px]">
          <option value="">All Levels</option>
          {filters.levels.map(l => (
            <option key={l.code} value={l.code}>{l.code} — {l.displayName}</option>
          ))}
        </select>

        <select value={city} onChange={e => { setCity(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[130px]">
          <option value="">All Cities</option>
          {filters.cities.map(c => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>

        <select value={sortBy} onChange={e => { setSortBy(e.target.value as 'totalComp' | 'baseSalary'); setPage(1) }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="totalComp">Sort: Total Comp</option>
          <option value="baseSalary">Sort: Base Salary</option>
        </select>

        <span className="ml-auto text-sm text-gray-400 self-center">
          {total} results
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Company', 'Level', 'City', 'YOE', 'Base (₹L)', 'Bonus (₹L)', 'ESOP (₹L)', 'Total TC (₹L)'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : salaries.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No results found</td></tr>
              ) : salaries.map(s => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.company}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TIER_COLORS[s.tier] || 'bg-gray-100 text-gray-600'}`}>
                      {s.tier.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{s.level}</span>
                    <div className="text-xs text-gray-400 mt-0.5">{s.levelDisplay}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.city}</td>
                  <td className="px-4 py-3 text-gray-600">{s.yoe}y</td>
                  <td className="px-4 py-3">{s.baseSalary.toFixed(1)}</td>
                  <td className="px-4 py-3 text-green-600">{s.bonus.toFixed(1)}</td>
                  <td className="px-4 py-3 text-blue-600">{s.esop.toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">{s.totalComp}</span>
                    {s.isVerified && (
                      <span className="ml-1.5 text-xs text-green-500 font-medium">✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50">
              Previous
            </button>
            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

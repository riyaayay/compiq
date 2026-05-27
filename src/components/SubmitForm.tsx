'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TIER_LEVELS: Record<string, string[]> = {
  FAANG:           ['L3', 'L4', 'L5', 'L6', 'L7'],
  PRODUCT_STARTUP: ['SDE1', 'SDE2', 'SDE3', 'STAFF', 'PRINC'],
  MNC:             ['SDE1', 'SDE2', 'SDE3', 'STAFF'],
  IT_SERVICES:     ['ANALYST', 'SR_ANALYST', 'CONSULTANT', 'SR_CONSULT'],
}

type Company = { name: string; slug: string; tier: string }
type City    = { name: string }

export default function SubmitForm({
  companies,
  cities,
}: {
  companies: Company[]
  cities:    City[]
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    companySlug: '', levelCode: '', cityName: '',
    baseSalary: '', bonus: '0', esop: '0', yoe: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const selectedCompany   = companies.find(c => c.slug === form.companySlug)
  const availableLevels   = selectedCompany ? (TIER_LEVELS[selectedCompany.tier] ?? []) : []
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.companySlug || !form.levelCode || !form.cityName || !form.baseSalary || !form.yoe) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setLoading(true)
    const res  = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companySlug: form.companySlug,
        levelCode:   form.levelCode,
        cityName:    form.cityName,
        baseSalary:  parseFloat(form.baseSalary),
        bonus:       parseFloat(form.bonus)  || 0,
        esop:        parseFloat(form.esop)   || 0,
        yoe:         parseInt(form.yoe),
      }),
    })
    const json = await res.json()
    if (json.error) {
      setError(json.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      setTimeout(() => router.push('/explore'), 2000)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="font-bold text-lg text-green-700">Submitted successfully!</h2>
        <p className="text-green-600 text-sm mt-1">Redirecting you to Explore...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-600">Company *</label>
          <select value={form.companySlug}
            onChange={e => { set('companySlug', e.target.value); set('levelCode', '') }}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Select company</option>
            {companies.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Level *</label>
          <select value={form.levelCode} onChange={e => set('levelCode', e.target.value)}
            disabled={!form.companySlug}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50">
            <option value="">Select level</option>
            {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">City *</label>
          <select value={form.cityName} onChange={e => set('cityName', e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Select city</option>
            {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Base salary (₹L / year) *</label>
          <input type="number" value={form.baseSalary} onChange={e => set('baseSalary', e.target.value)}
            placeholder="e.g. 35" min="1" max="500"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Years of experience *</label>
          <input type="number" value={form.yoe} onChange={e => set('yoe', e.target.value)}
            placeholder="e.g. 4" min="0" max="40"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Annual bonus (₹L)</label>
          <input type="number" value={form.bonus} onChange={e => set('bonus', e.target.value)}
            min="0" max="200"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Annual ESOP value (₹L)</label>
          <input type="number" value={form.esop} onChange={e => set('esop', e.target.value)}
            min="0" max="500"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Submitting...' : 'Submit Salary →'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Your submission is anonymous and helps the community.
      </p>
    </form>
  )
}

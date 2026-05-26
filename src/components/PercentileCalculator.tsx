'use client'
import { useState } from 'react'

const CITIES = ['Bangalore', 'Hyderabad', 'Pune', 'Delhi NCR', 'Mumbai', 'Chennai']
const LEVELS = ['L3','L4','L5','L6','L7','SDE1','SDE2','SDE3','STAFF','PRINC','ANALYST','SR_ANALYST','CONSULTANT']

type Result = {
  percentile: number
  userTC:     number
  adjustedTC: number
  costIndex:  number
  verdict:    string
  peers: { count: number; p25: number; median: number; p75: number; highest: number }
}

export default function PercentileCalculator() {
  const [form, setForm]     = useState({ baseSalary: '', bonus: '0', esop: '0', level: 'SDE2', city: 'Bangalore', yoe: '' })
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function calculate() {
    if (!form.baseSalary || !form.yoe) { setError('Please fill in base salary and years of experience.'); return }
    setError('')
    setLoading(true)
    const res  = await fetch('/api/percentile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseSalary: parseFloat(form.baseSalary),
        bonus:      parseFloat(form.bonus)  || 0,
        esop:       parseFloat(form.esop)   || 0,
        level:      form.level,
        city:       form.city,
        yoe:        parseInt(form.yoe),
      }),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setLoading(false); return }
    setResult(json)
    setLoading(false)
  }

  const verdictColor =
    result?.verdict === 'Above market'               ? 'text-green-600' :
    result?.verdict === 'At market'                  ? 'text-blue-600'  :
    result?.verdict === 'Below market'               ? 'text-orange-500':
    'text-red-500'

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm text-gray-500">Base salary (₹L per year) *</label>
            <input type="number" value={form.baseSalary} onChange={e => set('baseSalary', e.target.value)}
              placeholder="e.g. 35" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Annual bonus (₹L)</label>
            <input type="number" value={form.bonus} onChange={e => set('bonus', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Annual ESOP value (₹L)</label>
            <input type="number" value={form.esop} onChange={e => set('esop', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Your level *</label>
            <select value={form.level} onChange={e => set('level', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">City *</label>
            <select value={form.city} onChange={e => set('city', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-gray-500">Years of experience *</label>
            <input type="number" value={form.yoe} onChange={e => set('yoe', e.target.value)}
              placeholder="e.g. 4" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <button onClick={calculate} disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Calculating...' : 'Calculate My Percentile →'}
      </button>

      {result && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          {/* Big percentile */}
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-blue-600 mb-1">{result.percentile}<span className="text-2xl">th</span></div>
            <div className="text-gray-500 mb-2">percentile among peers at your level</div>
            <span className={`text-lg font-semibold ${verdictColor}`}>{result.verdict}</span>
          </div>

          {/* Progress bar */}
          <div className="bg-gray-100 rounded-full h-3 mb-6">
            <div className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${result.percentile}%` }} />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Your TC', value: `₹${result.userTC}L` },
              { label: `CoL-adjusted (Bangalore base)`, value: `₹${result.adjustedTC}L` },
              { label: 'Market P25', value: `₹${result.peers.p25}L` },
              { label: 'Market median', value: `₹${result.peers.median}L` },
              { label: 'Market P75', value: `₹${result.peers.p75}L` },
              { label: 'Peer sample size', value: `${result.peers.count} people` },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-lg px-4 py-3">
                <div className="text-xs text-gray-400">{s.label}</div>
                <div className="font-semibold text-sm mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>

          {result.percentile < 50 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
              💡 To reach the market median (₹{result.peers.median}L), you would need a{' '}
              <strong>₹{Math.max(0, result.peers.median - result.userTC).toFixed(1)}L increase</strong>.
              Consider requesting a raise or exploring competing offers.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

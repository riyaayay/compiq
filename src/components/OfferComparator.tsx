'use client'
import { useState } from 'react'

type Offer = {
  companyName: string; role: string; level: string; city: string
  baseSalary: number; bonus: number; esop: number; esopVesting: number
}

type Result = {
  offerA: Offer & { totalComp: number; adjustedTC: number; costIndex: number; vsMarket: number; annualEsop: number }
  offerB: Offer & { totalComp: number; adjustedTC: number; costIndex: number; vsMarket: number; annualEsop: number }
  winner: 'A' | 'B' | 'TIE'
  summary: string
}

const CITIES   = ['Bangalore', 'Hyderabad', 'Pune', 'Delhi NCR', 'Mumbai', 'Chennai']
const LEVELS   = ['L3','L4','L5','L6','L7','SDE1','SDE2','SDE3','STAFF','PRINC','ANALYST','SR_ANALYST','CONSULTANT']

const emptyOffer = (): Offer => ({
  companyName: '', role: 'Software Engineer', level: 'SDE2',
  city: 'Bangalore', baseSalary: 0, bonus: 0, esop: 0, esopVesting: 4,
})

function OfferForm({
  label, offer, onChange,
}: {
  label: string
  offer: Offer
  onChange: (o: Offer) => void
}) {
  const set = (k: keyof Offer, v: string | number) =>
    onChange({ ...offer, [k]: v })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-lg mb-4">{label}</h2>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-500">Company name</label>
          <input type="text" value={offer.companyName}
            onChange={e => set('companyName', e.target.value)}
            placeholder="e.g. Razorpay"
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-500">Level</label>
            <select value={offer.level} onChange={e => set('level', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">City</label>
            <select value={offer.city} onChange={e => set('city', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-500">Base salary (₹L / year)</label>
          <input type="number" value={offer.baseSalary || ''}
            onChange={e => set('baseSalary', parseFloat(e.target.value) || 0)}
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-500">Annual bonus (₹L)</label>
            <input type="number" value={offer.bonus || ''}
              onChange={e => set('bonus', parseFloat(e.target.value) || 0)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Total ESOP grant (₹L)</label>
            <input type="number" value={offer.esop || ''}
              onChange={e => set('esop', parseFloat(e.target.value) || 0)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-500">Vesting period (years)</label>
          <select value={offer.esopVesting} onChange={e => set('esopVesting', parseInt(e.target.value))}
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            {[1, 2, 3, 4, 5].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

export default function OfferComparator() {
  const [offerA, setOfferA] = useState<Offer>(emptyOffer())
  const [offerB, setOfferB] = useState<Offer>(emptyOffer())
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function compare() {
    if (!offerA.baseSalary || !offerB.baseSalary) {
      setError('Please fill in base salary for both offers.')
      return
    }
    setError('')
    setLoading(true)
    const res  = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerA, offerB }),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setLoading(false); return }
    setResult(json)
    setLoading(false)
  }

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <OfferForm label="Offer A" offer={offerA} onChange={setOfferA} />
        <OfferForm label="Offer B" offer={offerB} onChange={setOfferB} />
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <button onClick={compare} disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Comparing...' : 'Compare Offers →'}
      </button>

      {result && (
        <div className="mt-6 bg-white rounded-xl border-2 border-blue-200 p-5">
          {/* Winner banner */}
          <div className={`rounded-lg p-4 mb-5 text-center ${result.winner === 'TIE' ? 'bg-gray-50' : 'bg-blue-50'}`}>
            {result.winner !== 'TIE' ? (
              <>
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  Offer {result.winner} Wins 🎉
                </div>
                <p className="text-gray-600 text-sm">{result.summary}</p>
              </>
            ) : (
              <div className="text-lg font-semibold text-gray-600">It&apos;s a tie — both offers are effectively equal</div>
            )}
          </div>

          {/* Side by side comparison */}
          <div className="grid grid-cols-3 text-sm">
            <div className="text-gray-500 font-medium space-y-3">
              <div className="h-8 flex items-center">Metric</div>
              {['Company','Level','City','Base (₹L)','Bonus (₹L)','ESOP annual (₹L)','Total TC (₹L)','CoL-adjusted TC','vs Market'].map(l => (
                <div key={l} className="h-8 flex items-center text-gray-400">{l}</div>
              ))}
            </div>
            {(['offerA', 'offerB'] as const).map((key, i) => {
              const o      = result[key] as any
              const isWin  = result.winner === (i === 0 ? 'A' : 'B')
              return (
                <div key={key} className={`space-y-3 ${isWin ? 'text-blue-700' : 'text-gray-700'}`}>
                  <div className={`h-8 flex items-center font-semibold ${isWin ? 'text-blue-700' : ''}`}>
                    Offer {i === 0 ? 'A' : 'B'} {isWin ? '✓' : ''}
                  </div>
                  {[
                    o.companyName, o.level, `${o.city} (CoL ${o.costIndex})`,
                    o.baseSalary, o.bonus, o.annualEsop, o.totalComp, o.adjustedTC,
                    `${o.vsMarket > 0 ? '+' : ''}${o.vsMarket}% vs market`,
                  ].map((v, idx) => (
                    <div key={idx} className={`h-8 flex items-center font-medium ${idx >= 4 ? 'font-bold' : ''}`}>
                      {v}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProgressionChart from '@/components/ProgressionChart'

async function getCompany(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      roles: {
        include: {
          levels: {
            orderBy: { sortOrder: 'asc' },
            include: {
              salaries: { include: { city: true } },
            },
          },
        },
      },
    },
  })

  if (!company) return null

  // Build level progression data
  const progression = company.roles.flatMap(r =>
    r.levels.map(level => {
      const salaries   = level.salaries
      const totalComps = salaries.map(s => s.baseSalary + s.bonus + s.esop).sort((a, b) => a - b)
      const bases      = salaries.map(s => s.baseSalary).sort((a, b) => a - b)
      const bonuses    = salaries.map(s => s.bonus).sort((a, b) => a - b)
      const esops      = salaries.map(s => s.esop).sort((a, b) => a - b)

      const median = (arr: number[]) =>
        arr.length ? Math.round(arr[Math.floor(arr.length / 2)]) : 0
      const p25 = (arr: number[]) =>
        arr.length ? Math.round(arr[Math.floor(arr.length * 0.25)]) : 0
      const p75 = (arr: number[]) =>
        arr.length ? Math.round(arr[Math.floor(arr.length * 0.75)]) : 0

      return {
        levelCode:    level.code,
        levelDisplay: level.displayName,
        sortOrder:    level.sortOrder,
        count:        salaries.length,
        medianTC:     median(totalComps),
        p25TC:        p25(totalComps),
        p75TC:        p75(totalComps),
        medianBase:   median(bases),
        medianBonus:  median(bonuses),
        medianEsop:   median(esops),
      }
    })
  ).sort((a, b) => a.sortOrder - b.sortOrder)

  // City breakdown
  const allSalaries = company.roles.flatMap(r => r.levels.flatMap(l => l.salaries))
  const cityBreakdown: Record<string, number> = {}
  allSalaries.forEach(s => {
    const cityName = (s.city as any).name
    cityBreakdown[cityName] = (cityBreakdown[cityName] || 0) + 1
  })

  return {
    company: {
      id:       company.id,
      name:     company.name,
      slug:     company.slug,
      tier:     company.tier,
      industry: company.industry,
    },
    progression,
    cityBreakdown,
    totalDataPoints: allSalaries.length,
  }
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getCompany(slug)
  if (!data) notFound()

  const { company, progression, cityBreakdown, totalDataPoints } = data

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <span className="text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
            {company.tier.replace('_', ' ')}
          </span>
        </div>
        <p className="text-gray-500">{company.industry} · {totalDataPoints} data points</p>
      </div>

      {/* Level ladder table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Compensation by Level</h2>
          <p className="text-sm text-gray-400 mt-0.5">All figures in ₹L per annum</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Level', 'Title', 'Median Base', 'Median Bonus', 'Median ESOP', 'Median TC', 'P25 – P75', 'Samples'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {progression.map((l: any) => (
                <tr key={l.levelCode} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono text-xs bg-gray-50 font-medium">{l.levelCode}</td>
                  <td className="px-4 py-3 text-gray-600">{l.levelDisplay}</td>
                  <td className="px-4 py-3">{l.medianBase}</td>
                  <td className="px-4 py-3 text-green-600">{l.medianBonus}</td>
                  <td className="px-4 py-3 text-blue-600">{l.medianEsop}</td>
                  <td className="px-4 py-3 font-bold">{l.medianTC}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{l.p25TC} – {l.p75TC}</td>
                  <td className="px-4 py-3 text-gray-400">{l.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progression chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h2 className="font-semibold mb-4">Career Progression Chart</h2>
        <ProgressionChart data={progression} />
      </div>

      {/* City breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4">Data by City</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(cityBreakdown).map(([city, count]) => (
            <div key={city} className="bg-gray-50 rounded-lg px-4 py-2 text-sm">
              <span className="font-medium">{city}</span>
              <span className="text-gray-400 ml-2">{count as number} entries</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

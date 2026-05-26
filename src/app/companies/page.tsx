import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const TIER_LABELS: Record<string, string> = {
  FAANG:           'FAANG',
  PRODUCT_STARTUP: 'Startup',
  MNC:             'MNC',
  IT_SERVICES:     'IT Services',
}

const TIER_COLORS: Record<string, string> = {
  FAANG:           'bg-purple-100 text-purple-700',
  PRODUCT_STARTUP: 'bg-blue-100 text-blue-700',
  MNC:             'bg-green-100 text-green-700',
  IT_SERVICES:     'bg-gray-100 text-gray-600',
}

async function getCompanies() {
  const companies = await prisma.company.findMany({
    include: {
      roles: {
        include: {
          levels: {
            include: {
              salaries: { include: { city: true } },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return companies.map(c => {
    const allSalaries = c.roles.flatMap(r =>
      r.levels.flatMap(l => l.salaries)
    )
    const totalComps = allSalaries.map(s => s.baseSalary + s.bonus + s.esop)
    const medianTC   = totalComps.length
      ? Math.round(totalComps.sort((a, b) => a - b)[Math.floor(totalComps.length / 2)])
      : 0

    return {
      id:          c.id,
      name:        c.name,
      slug:        c.slug,
      tier:        c.tier,
      industry:    c.industry,
      dataPoints:  allSalaries.length,
      medianTC,
    }
  })
}

export default async function CompaniesPage() {
  const companies = await getCompanies()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Companies</h1>
      <p className="text-gray-500 mb-8">Browse compensation data by company</p>

      <div className="grid md:grid-cols-2 gap-4">
        {companies.map((c) => (
          <Link key={c.slug} href={`/companies/${c.slug}`}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-semibold text-lg">{c.name}</h2>
                <p className="text-gray-400 text-sm">{c.industry}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${TIER_COLORS[c.tier]}`}>
                {TIER_LABELS[c.tier]}
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <div className="text-gray-400">Median TC</div>
                <div className="font-semibold">₹{c.medianTC}L</div>
              </div>
              <div>
                <div className="text-gray-400">Data points</div>
                <div className="font-semibold">{c.dataPoints}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

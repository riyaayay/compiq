import SalaryExplorer from '@/components/SalaryExplorer'
import { prisma } from '@/lib/prisma'

async function getFilterOptions() {
  const [companies, cities, levels] = await Promise.all([
    prisma.company.findMany({ select: { name: true, slug: true }, orderBy: { name: 'asc' } }),
    prisma.city.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.level.findMany({ select: { code: true, displayName: true }, distinct: ['code'], orderBy: { sortOrder: 'asc' } }),
  ])
  return { companies, cities, levels }
}

export default async function ExplorePage() {
  const filters = await getFilterOptions()
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Explore Salaries</h1>
        <p className="text-gray-500 mt-1">Browse salary data across Indian tech companies. No login required.</p>
      </div>
      <SalaryExplorer filters={filters} />
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
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

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

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

  return NextResponse.json({
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
  })
}
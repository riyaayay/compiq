import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

  const data = companies.map(c => {
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

  return NextResponse.json({ data })
}
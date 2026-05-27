import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  company:   z.string().optional(),
  level:     z.string().optional(),
  city:      z.string().optional(),
  role:      z.string().optional(),
  minComp:   z.coerce.number().optional(),
  maxComp:   z.coerce.number().optional(),
  page:      z.coerce.number().default(1),
  limit:     z.coerce.number().default(20).transform(v => Math.min(v, 50)),
  sortBy:    z.enum(['totalComp', 'baseSalary', 'submittedAt']).default('totalComp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = querySchema.parse(Object.fromEntries(searchParams))

    const where: Record<string, unknown> = {}

    if (params.company) {
      where.level = {
        role: { company: { slug: params.company } },
      }
    }
    if (params.level) {
      where.level = { ...(where.level as object), code: params.level }
    }
    if (params.city) {
      where.city = { name: params.city }
    }

    // Fetch ALL matching records so we can sort by totalComp (computed field)
    // and then paginate in memory. Dataset is small enough for this to be fast.
    const allSalaries = await prisma.salary.findMany({
      where,
      include: {
        level: { include: { role: { include: { company: true } } } },
        city:  true,
      },
      // For submittedAt sort we let DB do it; for computed fields we sort below
      orderBy: params.sortBy === 'submittedAt'
        ? { submittedAt: params.sortOrder }
        : { submittedAt: 'desc' }, // stable secondary sort
    })

    // Map → compute totalComp → filter → sort → paginate
    const mapped = allSalaries.map(s => ({
      id:           s.id,
      company:      s.level.role.company.name,
      companySlug:  s.level.role.company.slug,
      tier:         s.level.role.company.tier,
      role:         s.level.role.name,
      level:        s.level.code,
      levelDisplay: s.level.displayName,
      city:         s.city.name,
      baseSalary:   s.baseSalary,
      bonus:        s.bonus,
      esop:         s.esop,
      totalComp:    Math.round(s.baseSalary + s.bonus + s.esop),
      yoe:          s.yoe,
      isVerified:   s.isVerified,
      submittedAt:  s.submittedAt,
    }))

    const filtered = mapped.filter(s =>
      (!params.minComp || s.totalComp >= params.minComp) &&
      (!params.maxComp || s.totalComp <= params.maxComp)
    )

    // Sort by the exact requested field (totalComp and baseSalary are numbers here)
    if (params.sortBy === 'totalComp' || params.sortBy === 'baseSalary') {
      const field = params.sortBy
      filtered.sort((a, b) =>
        params.sortOrder === 'desc'
          ? b[field] - a[field]
          : a[field] - b[field]
      )
    }
    // submittedAt already sorted by DB orderBy above

    const total    = filtered.length
    const page     = params.page
    const limit    = params.limit
    const data     = filtered.slice((page - 1) * limit, page * limit)

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
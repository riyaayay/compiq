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

    const where: any = {}

    if (params.company) {
      where.level = {
        role: { company: { slug: params.company } },
      }
    }
    if (params.level) {
      where.level = { ...where.level, code: params.level }
    }
    if (params.city) {
      where.city = { name: params.city }
    }

    const [salaries, total] = await Promise.all([
      prisma.salary.findMany({
        where,
        include: {
          level: { include: { role: { include: { company: true } } } },
          city:  true,
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: params.sortBy === 'baseSalary'
          ? { baseSalary: params.sortOrder }
          : params.sortBy === 'submittedAt'
          ? { submittedAt: params.sortOrder }
          : { baseSalary: params.sortOrder }, // totalComp: sort by baseSalary (dominant component)
      }),
      prisma.salary.count({ where }),
    ])

    const data = salaries
      .map(s => ({
        id:          s.id,
        company:     s.level.role.company.name,
        companySlug: s.level.role.company.slug,
        tier:        s.level.role.company.tier,
        role:        s.level.role.name,
        level:       s.level.code,
        levelDisplay:s.level.displayName,
        city:        s.city.name,
        baseSalary:  s.baseSalary,
        bonus:       s.bonus,
        esop:        s.esop,
        totalComp:   Math.round(s.baseSalary + s.bonus + s.esop),
        yoe:         s.yoe,
        isVerified:  s.isVerified,
        submittedAt: s.submittedAt,
      }))
      .filter(s =>
        (!params.minComp || s.totalComp >= params.minComp) &&
        (!params.maxComp || s.totalComp <= params.maxComp)
      )


    return NextResponse.json({
      data,
      pagination: {
        total,
        page:       params.page,
        limit:      params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
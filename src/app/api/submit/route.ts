import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  companySlug: z.string(),
  levelCode:   z.string(),
  cityName:    z.string(),
  baseSalary:  z.number().positive().max(500),   // max 500L — reject wild outliers
  bonus:       z.number().min(0).max(200),
  esop:        z.number().min(0).max(500),
  yoe:         z.number().min(0).max(40),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }

    const body   = await req.json()
    const parsed = schema.parse(body)

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Find matching level
    const level = await prisma.level.findFirst({
      where: {
        code: parsed.levelCode,
        role: { company: { slug: parsed.companySlug } },
      },
    })
    if (!level) return NextResponse.json({ error: 'Level not found' }, { status: 404 })

    const city = await prisma.city.findUnique({ where: { name: parsed.cityName } })
    if (!city) return NextResponse.json({ error: 'City not found' }, { status: 404 })

    const salary = await prisma.salary.create({
      data: {
        baseSalary:  parsed.baseSalary,
        bonus:       parsed.bonus,
        esop:        parsed.esop,
        yoe:         parsed.yoe,
        isVerified:  false,
        source:      'user_submitted',
        levelId:     level.id,
        cityId:      city.id,
        userId:      user.id,
      },
    })

    return NextResponse.json({ id: salary.id, message: 'Salary submitted successfully' })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 })
  }
}
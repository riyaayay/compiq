import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  baseSalary: z.number().positive(),
  bonus:      z.number().min(0),
  esop:       z.number().min(0),
  level:      z.string(),
  city:       z.string(),
  yoe:        z.number().min(0).max(40),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.parse(body)
    const userTC = parsed.baseSalary + parsed.bonus + parsed.esop

    // Find similar salaries (same level code, ±2 years YOE)
    const peers = await prisma.salary.findMany({
      where: {
        level: { code: parsed.level },
        yoe:   { gte: Math.max(0, parsed.yoe - 2), lte: parsed.yoe + 2 },
      },
      include: { city: true },
    })

    const peerTCs = peers
      .map(s => s.baseSalary + s.bonus + s.esop)
      .sort((a, b) => a - b)

    const belowCount = peerTCs.filter(tc => tc < userTC).length
    const percentile = peerTCs.length
      ? Math.round((belowCount / peerTCs.length) * 100)
      : 50

    const median  = peerTCs.length ? Math.round(peerTCs[Math.floor(peerTCs.length / 2)]) : userTC
    const p25     = peerTCs.length ? Math.round(peerTCs[Math.floor(peerTCs.length * 0.25)]) : 0
    const p75     = peerTCs.length ? Math.round(peerTCs[Math.floor(peerTCs.length * 0.75)]) : 0
    const highest = peerTCs.length ? Math.round(peerTCs[peerTCs.length - 1]) : userTC

    // CoL-adjusted rank (Bangalore = 100 baseline)
    const cityRecord = await prisma.city.findUnique({ where: { name: parsed.city } })
    const costIndex  = cityRecord?.costIndex ?? 100
    const adjustedTC = Math.round((userTC / costIndex) * 100)

    return NextResponse.json({
      percentile,
      userTC:      Math.round(userTC),
      adjustedTC,
      costIndex,
      peers: {
        count:  peerTCs.length,
        p25,
        median,
        p75,
        highest,
      },
      verdict:
        percentile >= 75 ? 'Above market' :
        percentile >= 50 ? 'At market'    :
        percentile >= 25 ? 'Below market' :
        'Significantly below market',
    })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
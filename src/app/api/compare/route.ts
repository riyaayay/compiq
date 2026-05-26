import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const offerSchema = z.object({
  companyName: z.string(),
  role:        z.string(),
  level:       z.string(),
  city:        z.string(),
  baseSalary:  z.number().positive(),
  bonus:       z.number().min(0),
  esop:        z.number().min(0),
  esopVesting: z.number().min(1).max(6).default(4),
})

const schema = z.object({
  offerA: offerSchema,
  offerB: offerSchema,
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.parse(body)

    async function enrichOffer(offer: z.infer<typeof offerSchema>) {
      const city      = await prisma.city.findUnique({ where: { name: offer.city } })
      const costIndex = city?.costIndex ?? 100

      const annualEsop = Math.round(offer.esop / offer.esopVesting)
      const totalComp  = Math.round(offer.baseSalary + offer.bonus + annualEsop)
      const adjustedTC = Math.round((totalComp / costIndex) * 100)

      // Find market median for this level
      const peers = await prisma.salary.findMany({
        where: { level: { code: offer.level } },
      })
      const peerTCs = peers.map(s => s.baseSalary + s.bonus + s.esop).sort((a, b) => a - b)
      const marketMedian = peerTCs.length
        ? Math.round(peerTCs[Math.floor(peerTCs.length / 2)])
        : totalComp
      const vsMarket = peerTCs.length
        ? Math.round(((totalComp - marketMedian) / marketMedian) * 100)
        : 0

      return {
        ...offer,
        annualEsop,
        totalComp,
        adjustedTC,
        costIndex,
        marketMedian,
        vsMarket,
      }
    }

    const [enrichedA, enrichedB] = await Promise.all([
      enrichOffer(parsed.offerA),
      enrichOffer(parsed.offerB),
    ])

    const winner =
      enrichedA.adjustedTC > enrichedB.adjustedTC ? 'A' :
      enrichedB.adjustedTC > enrichedA.adjustedTC ? 'B' : 'TIE'

    const diff = Math.abs(enrichedA.adjustedTC - enrichedB.adjustedTC)

    return NextResponse.json({
      offerA:      enrichedA,
      offerB:      enrichedB,
      winner,
      diffAdjusted: diff,
      summary:
        winner === 'TIE'
          ? 'Both offers are effectively equal after cost-of-living adjustment.'
          : `Offer ${winner} is worth ₹${diff.toFixed(1)}L more after city cost-of-living adjustment.`,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
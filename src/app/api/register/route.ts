import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  name:     z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const hash = await bcrypt.hash(parsed.password, 12)
    const user = await prisma.user.create({
      data: { email: parsed.email, name: parsed.name, passwordHash: hash },
    })

    return NextResponse.json({ id: user.id, email: user.email })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
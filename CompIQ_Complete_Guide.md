# CompIQ — Complete Building Guide
### India-first Compensation Intelligence Platform

---

## Platforms You'll Use (and Why)

| Platform | Purpose | Free? |
|----------|---------|-------|
| **VS Code** | Code editor | Yes |
| **Node.js** | Run JavaScript on your computer | Yes |
| **GitHub** | Store your code | Yes |
| **Neon.tech** | PostgreSQL database in the cloud | Yes |
| **Vercel** | Deploy your Next.js app live | Yes |
| **Google Cloud Console** | Google OAuth login | Yes |

---

## PHASE 1 — Setup (30 min)

### Step 1: Install prerequisites

Download and install these if you don't have them:
- Node.js v20+: https://nodejs.org (click LTS)
- VS Code: https://code.visualstudio.com
- Git: https://git-scm.com

Open your terminal (Mac: Terminal app, Windows: Command Prompt or PowerShell).

```bash
# Verify everything is installed
node --version    # should show v20.x.x
npm --version     # should show 10.x.x
git --version     # should show git version x.x.x
```

### Step 2: Create the Next.js project

```bash
npx create-next-app@latest compiq --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd compiq
code .
```

When prompted, answer:
- Would you like to use TypeScript? → **Yes**
- Would you like to use ESLint? → **Yes**
- Would you like to use Tailwind CSS? → **Yes**
- Would you like to use the `src/` directory? → **Yes**
- Would you like to use the App Router? → **Yes**
- Would you like to customize the default import alias? → **Yes, @/***

### Step 3: Install all dependencies

```bash
npm install @prisma/client next-auth bcryptjs zod recharts
npm install -D prisma @types/bcryptjs
```

What each package does:
- `@prisma/client` + `prisma` → talk to your database
- `next-auth` → handle login/signup
- `bcryptjs` → hash passwords securely
- `zod` → validate API inputs
- `recharts` → draw charts

### Step 4: Initialize Prisma

```bash
npx prisma init
```

This creates a `prisma/` folder and a `.env` file.

---

## PHASE 2 — Database on Neon (20 min)

### Step 1: Create a free Neon database

1. Go to https://neon.tech
2. Sign up with GitHub
3. Click "New Project"
4. Name it `compiq`
5. Choose region: `AWS / ap-south-1` (Mumbai — closest to India)
6. Click "Create Project"
7. On the dashboard, click "Connection string"
8. Copy the string that looks like: `postgresql://user:password@host/neondb?sslmode=require`

### Step 2: Add to your .env file

Open `.env` in VS Code and replace everything with:

```env
DATABASE_URL="postgresql://YOUR_CONNECTION_STRING_HERE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run-this-command-to-generate: openssl rand -base64 32"
GOOGLE_CLIENT_ID="get-this-from-google-cloud-in-phase-5"
GOOGLE_CLIENT_SECRET="get-this-from-google-cloud-in-phase-5"
```

> To generate NEXTAUTH_SECRET, run in terminal: `openssl rand -base64 32` and paste the output.

---

## PHASE 3 — Database Schema

### File: `prisma/schema.prisma`

Delete everything in this file and paste:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Company {
  id       String  @id @default(cuid())
  name     String
  slug     String  @unique
  tier     Tier
  industry String
  roles    Role[]

  @@map("companies")
}

model Role {
  id              String  @id @default(cuid())
  name            String
  normalizedTitle String
  companyId       String
  company         Company @relation(fields: [companyId], references: [id])
  levels          Level[]

  @@map("roles")
}

model Level {
  id          String   @id @default(cuid())
  code        String
  displayName String
  sortOrder   Int
  roleId      String
  role        Role     @relation(fields: [roleId], references: [id])
  salaries    Salary[]

  @@map("levels")
}

model City {
  id         String   @id @default(cuid())
  name       String   @unique
  costIndex  Int
  salaries   Salary[]

  @@map("cities")
}

model Salary {
  id           String   @id @default(cuid())
  baseSalary   Float
  bonus        Float    @default(0)
  esop         Float    @default(0)
  joiningBonus Float    @default(0)
  yoe          Int
  isVerified   Boolean  @default(false)
  source       String   @default("user_submitted")
  submittedAt  DateTime @default(now())
  levelId      String
  cityId       String
  userId       String?
  level        Level    @relation(fields: [levelId], references: [id])
  city         City     @relation(fields: [cityId], references: [id])
  user         User?    @relation(fields: [userId], references: [id])

  @@map("salaries")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?
  name         String?
  image        String?
  createdAt    DateTime @default(now())
  salaries     Salary[]

  @@map("users")
}

enum Tier {
  FAANG
  PRODUCT_STARTUP
  MNC
  IT_SERVICES
}
```

### Run the migration

```bash
npx prisma db push
```

You should see: `Your database is now in sync with your Prisma schema.`

---

## PHASE 4 — Seed Data (200+ Realistic Indian Tech Salaries)

### File: `prisma/seed.ts`

Create this file at `prisma/seed.ts`:

```typescript
import { PrismaClient, Tier } from '@prisma/client'

const prisma = new PrismaClient()

// Helper: random number between min and max, rounded to 1 decimal
function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

async function main() {
  console.log('Seeding database...')

  // ─── Cities ──────────────────────────────────────────────
  const cities = await Promise.all([
    prisma.city.upsert({ where: { name: 'Bangalore' },    update: {}, create: { name: 'Bangalore',  costIndex: 100 } }),
    prisma.city.upsert({ where: { name: 'Hyderabad' },   update: {}, create: { name: 'Hyderabad', costIndex: 80 } }),
    prisma.city.upsert({ where: { name: 'Pune' },        update: {}, create: { name: 'Pune',       costIndex: 75 } }),
    prisma.city.upsert({ where: { name: 'Delhi NCR' },   update: {}, create: { name: 'Delhi NCR',  costIndex: 85 } }),
    prisma.city.upsert({ where: { name: 'Mumbai' },      update: {}, create: { name: 'Mumbai',     costIndex: 95 } }),
    prisma.city.upsert({ where: { name: 'Chennai' },     update: {}, create: { name: 'Chennai',    costIndex: 78 } }),
  ])

  const cityMap: Record<string, string> = {}
  cities.forEach(c => { cityMap[c.name] = c.id })

  // ─── Companies ───────────────────────────────────────────
  const companyData = [
    { name: 'Google India',   slug: 'google',      tier: Tier.FAANG,            industry: 'Technology' },
    { name: 'Meta India',     slug: 'meta',        tier: Tier.FAANG,            industry: 'Social Media' },
    { name: 'Amazon India',   slug: 'amazon',      tier: Tier.FAANG,            industry: 'E-Commerce / Cloud' },
    { name: 'Microsoft India',slug: 'microsoft',   tier: Tier.FAANG,            industry: 'Technology' },
    { name: 'Flipkart',       slug: 'flipkart',    tier: Tier.PRODUCT_STARTUP,  industry: 'E-Commerce' },
    { name: 'Swiggy',         slug: 'swiggy',      tier: Tier.PRODUCT_STARTUP,  industry: 'Food Delivery' },
    { name: 'Zomato',         slug: 'zomato',      tier: Tier.PRODUCT_STARTUP,  industry: 'Food Delivery' },
    { name: 'Razorpay',       slug: 'razorpay',    tier: Tier.PRODUCT_STARTUP,  industry: 'Fintech' },
    { name: 'CRED',           slug: 'cred',        tier: Tier.PRODUCT_STARTUP,  industry: 'Fintech' },
    { name: 'PhonePe',        slug: 'phonepe',     tier: Tier.PRODUCT_STARTUP,  industry: 'Fintech' },
    { name: 'Freshworks',     slug: 'freshworks',  tier: Tier.MNC,              industry: 'SaaS' },
    { name: 'TCS',            slug: 'tcs',         tier: Tier.IT_SERVICES,      industry: 'IT Services' },
    { name: 'Infosys',        slug: 'infosys',     tier: Tier.IT_SERVICES,      industry: 'IT Services' },
    { name: 'Wipro',          slug: 'wipro',       tier: Tier.IT_SERVICES,      industry: 'IT Services' },
  ]

  const companies = await Promise.all(
    companyData.map(c =>
      prisma.company.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      })
    )
  )

  const companyMap: Record<string, string> = {}
  companies.forEach(c => { companyMap[c.slug] = c.id })

  // ─── Level configs per tier ───────────────────────────────
  type LevelConfig = { code: string; displayName: string; sortOrder: number; baseLow: number; baseHigh: number; bonusLow: number; bonusHigh: number; esopLow: number; esopHigh: number; yoeLow: number; yoeHigh: number }

  const faangLevels: LevelConfig[] = [
    { code: 'L3',  displayName: 'SDE I',           sortOrder: 1, baseLow: 25,  baseHigh: 35,  bonusLow: 2,  bonusHigh: 5,  esopLow: 8,   esopHigh: 18,  yoeLow: 0, yoeHigh: 2 },
    { code: 'L4',  displayName: 'SDE II',          sortOrder: 2, baseLow: 38,  baseHigh: 58,  bonusLow: 5,  bonusHigh: 10, esopLow: 20,  esopHigh: 45,  yoeLow: 2, yoeHigh: 5 },
    { code: 'L5',  displayName: 'Senior SDE',      sortOrder: 3, baseLow: 58,  baseHigh: 90,  bonusLow: 10, bonusHigh: 20, esopLow: 45,  esopHigh: 90,  yoeLow: 5, yoeHigh: 9 },
    { code: 'L6',  displayName: 'Staff SDE',       sortOrder: 4, baseLow: 90,  baseHigh: 140, bonusLow: 20, bonusHigh: 40, esopLow: 90,  esopHigh: 180, yoeLow: 8, yoeHigh: 14 },
    { code: 'L7',  displayName: 'Senior Staff SDE',sortOrder: 5, baseLow: 140, baseHigh: 210, bonusLow: 35, bonusHigh: 60, esopLow: 160, esopHigh: 300, yoeLow: 12, yoeHigh: 20 },
  ]

  const startupLevels: LevelConfig[] = [
    { code: 'SDE1',   displayName: 'SDE 1',           sortOrder: 1, baseLow: 14,  baseHigh: 24,  bonusLow: 1,  bonusHigh: 3,  esopLow: 0,  esopHigh: 8,   yoeLow: 0, yoeHigh: 2 },
    { code: 'SDE2',   displayName: 'SDE 2',           sortOrder: 2, baseLow: 24,  baseHigh: 42,  bonusLow: 2,  bonusHigh: 6,  esopLow: 5,  esopHigh: 18,  yoeLow: 2, yoeHigh: 5 },
    { code: 'SDE3',   displayName: 'SDE 3 / Senior',  sortOrder: 3, baseLow: 40,  baseHigh: 68,  bonusLow: 5,  bonusHigh: 12, esopLow: 15, esopHigh: 40,  yoeLow: 4, yoeHigh: 8 },
    { code: 'STAFF',  displayName: 'Staff SDE',       sortOrder: 4, baseLow: 68,  baseHigh: 110, bonusLow: 12, bonusHigh: 25, esopLow: 35, esopHigh: 80,  yoeLow: 7, yoeHigh: 13 },
    { code: 'PRINC',  displayName: 'Principal SDE',   sortOrder: 5, baseLow: 110, baseHigh: 170, bonusLow: 25, bonusHigh: 45, esopLow: 70, esopHigh: 150, yoeLow: 11, yoeHigh: 18 },
  ]

  const mncLevels: LevelConfig[] = [
    { code: 'SDE1',   displayName: 'SDE 1',      sortOrder: 1, baseLow: 12, baseHigh: 22, bonusLow: 1,  bonusHigh: 3,  esopLow: 0,  esopHigh: 5,  yoeLow: 0, yoeHigh: 2 },
    { code: 'SDE2',   displayName: 'SDE 2',      sortOrder: 2, baseLow: 22, baseHigh: 38, bonusLow: 2,  bonusHigh: 5,  esopLow: 3,  esopHigh: 12, yoeLow: 2, yoeHigh: 5 },
    { code: 'SDE3',   displayName: 'Senior SDE', sortOrder: 3, baseLow: 35, baseHigh: 60, bonusLow: 5,  bonusHigh: 10, esopLow: 10, esopHigh: 30, yoeLow: 5, yoeHigh: 9 },
    { code: 'STAFF',  displayName: 'Staff SDE',  sortOrder: 4, baseLow: 58, baseHigh: 95, bonusLow: 10, bonusHigh: 20, esopLow: 25, esopHigh: 60, yoeLow: 8, yoeHigh: 14 },
  ]

  const itsLevels: LevelConfig[] = [
    { code: 'ANALYST',   displayName: 'Analyst',          sortOrder: 1, baseLow: 4,  baseHigh: 8,  bonusLow: 0.3, bonusHigh: 0.8, esopLow: 0, esopHigh: 0, yoeLow: 0, yoeHigh: 2 },
    { code: 'SR_ANALYST',displayName: 'Senior Analyst',   sortOrder: 2, baseLow: 8,  baseHigh: 16, bonusLow: 0.6, bonusHigh: 1.5, esopLow: 0, esopHigh: 0, yoeLow: 2, yoeHigh: 5 },
    { code: 'CONSULTANT',displayName: 'Consultant',       sortOrder: 3, baseLow: 14, baseHigh: 25, bonusLow: 1.2, bonusHigh: 3,   esopLow: 0, esopHigh: 0, yoeLow: 4, yoeHigh: 8 },
    { code: 'SR_CONSULT',displayName: 'Senior Consultant',sortOrder: 4, baseLow: 22, baseHigh: 40, bonusLow: 2.5, bonusHigh: 5,   esopLow: 0, esopHigh: 0, yoeLow: 7, yoeHigh: 12 },
  ]

  // ─── City assignments per company ────────────────────────
  const companyCities: Record<string, string[]> = {
    'google':    ['Bangalore', 'Hyderabad'],
    'meta':      ['Bangalore'],
    'amazon':    ['Bangalore', 'Hyderabad', 'Chennai'],
    'microsoft': ['Bangalore', 'Hyderabad'],
    'flipkart':  ['Bangalore'],
    'swiggy':    ['Bangalore'],
    'zomato':    ['Bangalore', 'Delhi NCR'],
    'razorpay':  ['Bangalore'],
    'cred':      ['Bangalore'],
    'phonepe':   ['Bangalore'],
    'freshworks':['Chennai', 'Bangalore'],
    'tcs':       ['Bangalore', 'Pune', 'Hyderabad', 'Mumbai'],
    'infosys':   ['Bangalore', 'Pune', 'Hyderabad'],
    'wipro':     ['Bangalore', 'Pune', 'Hyderabad'],
  }

  // ─── Level config per tier ────────────────────────────────
  const tierLevels: Record<string, LevelConfig[]> = {
    'google': faangLevels, 'meta': faangLevels, 'amazon': faangLevels, 'microsoft': faangLevels,
    'flipkart': startupLevels, 'swiggy': startupLevels, 'zomato': startupLevels,
    'razorpay': startupLevels, 'cred': startupLevels, 'phonepe': startupLevels,
    'freshworks': mncLevels,
    'tcs': itsLevels, 'infosys': itsLevels, 'wipro': itsLevels,
  }

  // ─── Build roles + levels + salaries ─────────────────────
  let totalSalaries = 0

  for (const companySlug of Object.keys(companyMap)) {
    const companyId = companyMap[companySlug]
    const levels    = tierLevels[companySlug]
    const cityCodes = companyCities[companySlug]

    // Create one "Software Engineer" role per company
    const role = await prisma.role.create({
      data: {
        name: 'Software Engineer',
        normalizedTitle: 'Software Engineer',
        companyId,
      },
    })

    for (const lCfg of levels) {
      const level = await prisma.level.create({
        data: {
          code: lCfg.code,
          displayName: lCfg.displayName,
          sortOrder: lCfg.sortOrder,
          roleId: role.id,
        },
      })

      // Generate 3-4 salary records per city per level
      for (const cityName of cityCodes) {
        const cityId     = cityMap[cityName]
        const numRecords = Math.floor(Math.random() * 2) + 3  // 3 or 4

        for (let i = 0; i < numRecords; i++) {
          await prisma.salary.create({
            data: {
              baseSalary:   rand(lCfg.baseLow,   lCfg.baseHigh),
              bonus:        rand(lCfg.bonusLow,  lCfg.bonusHigh),
              esop:         rand(lCfg.esopLow,   lCfg.esopHigh),
              joiningBonus: rand(0, 5),
              yoe:          Math.floor(rand(lCfg.yoeLow, lCfg.yoeHigh)),
              isVerified:   Math.random() > 0.4,   // 60% verified
              levelId:      level.id,
              cityId,
            },
          })
          totalSalaries++
        }
      }
    }
  }

  console.log(`✅ Seeded ${totalSalaries} salary records`)
  console.log(`✅ Seeded ${Object.keys(companyMap).length} companies`)
  console.log(`✅ Seeded ${cities.length} cities`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
```

### Add seed script to package.json

Open `package.json`, find the `"scripts"` section, and add the seed line:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "seed": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
},
"prisma": {
  "seed": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Install ts-node:

```bash
npm install -D ts-node
```

Run the seed:

```bash
npx prisma db seed
```

---

## PHASE 5 — Google OAuth Setup (15 min)

### Step 1: Google Cloud Console

1. Go to https://console.cloud.google.com
2. Click "Create Project" → name it `compiq`
3. In the sidebar, go to **APIs & Services → OAuth consent screen**
4. Choose **External** → Fill in app name `CompIQ`, your email
5. Click **Save and Continue** through the rest
6. Go to **APIs & Services → Credentials**
7. Click **Create Credentials → OAuth Client ID**
8. Application type: **Web application**
9. Authorized redirect URIs: add `http://localhost:3000/api/auth/callback/google`
10. Click **Create** → copy the Client ID and Client Secret
11. Paste them into your `.env` file

---

## PHASE 6 — Backend Code

### File: `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### File: `src/lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, email: user.email!, name: user.name }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        ;(session.user as any).id = token.id
      }
      return session
    },
    async signIn({ user, account }) {
      // Auto-create user on first Google login
      if (account?.provider === 'google') {
        const existing = await prisma.user.findUnique({
          where: { email: user.email! },
        })
        if (!existing) {
          await prisma.user.create({
            data: { email: user.email!, name: user.name, image: user.image },
          })
        }
      }
      return true
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}
```

### File: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### File: `src/app/api/register/route.ts`

```typescript
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
```

### File: `src/app/api/salaries/route.ts`

```typescript
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
        orderBy: { submittedAt: 'desc' },
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
      .sort((a, b) =>
        params.sortOrder === 'desc'
          ? b[params.sortBy as 'totalComp'] - a[params.sortBy as 'totalComp']
          : a[params.sortBy as 'totalComp'] - b[params.sortBy as 'totalComp']
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
```

### File: `src/app/api/companies/route.ts`

```typescript
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
```

### File: `src/app/api/companies/[slug]/route.ts`

```typescript
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
```

### File: `src/app/api/percentile/route.ts`

```typescript
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
```

### File: `src/app/api/compare/route.ts`

```typescript
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
```

### File: `src/app/api/submit/route.ts`

```typescript
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
```

---

## PHASE 7 — Frontend

### File: `src/app/globals.css`

Replace everything with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
body { @apply bg-gray-50 text-gray-900; }
```

### File: `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CompIQ — Know Your Worth',
  description: 'India-first compensation intelligence platform. Level-based salary data for Indian tech.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
```

### File: `src/components/Providers.tsx`

```typescript
'use client'
import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

### File: `src/components/Navbar.tsx`

```typescript
'use client'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-lg text-blue-600">CompIQ</Link>
          <div className="hidden md:flex gap-6 text-sm text-gray-600">
            <Link href="/explore"    className="hover:text-gray-900">Explore</Link>
            <Link href="/companies"  className="hover:text-gray-900">Companies</Link>
            <Link href="/compare"    className="hover:text-gray-900">Compare Offers</Link>
            <Link href="/percentile" className="hover:text-gray-900">Am I Underpaid?</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link href="/submit"
                className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700">
                + Submit Salary
              </Link>
              <button onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-900">
                Sign out
              </button>
            </>
          ) : (
            <button onClick={() => signIn()}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700">
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
```

### File: `src/app/page.tsx` (Home)

```typescript
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getStats() {
  const [salaryCount, companyCount] = await Promise.all([
    prisma.salary.count(),
    prisma.company.count(),
  ])
  return { salaryCount, companyCount }
}

export default async function Home() {
  const stats = await getStats()

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Know your worth, down to the level.
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            India&apos;s only level-first compensation intelligence platform.
            Real data. No paywalls. No signups to browse.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/explore"
              className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50">
              Explore Salaries
            </Link>
            <Link href="/compare"
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
              Compare Two Offers
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-200 py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">{stats.salaryCount}+</div>
            <div className="text-sm text-gray-500 mt-1">Salary data points</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">{stats.companyCount}</div>
            <div className="text-sm text-gray-500 mt-1">Companies covered</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">6</div>
            <div className="text-sm text-gray-500 mt-1">Indian cities</div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
        {[
          { title: 'Level-first comparison', desc: 'L3 at Google vs SDE2 at Razorpay — we normalize levels so you compare apples to apples.', href: '/explore' },
          { title: 'Offer comparison tool', desc: 'Paste two offers. We adjust for city cost-of-living and show you the real winner.', href: '/compare' },
          { title: 'Am I underpaid?', desc: 'Enter your comp, level, and YOE. Get your percentile vs your peer group instantly.', href: '/percentile' },
        ].map(f => (
          <Link key={f.title} href={f.href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

### File: `src/app/explore/page.tsx`

```typescript
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
        <p className="text-gray-500 mt-1">Browse {''} salary data across Indian tech companies. No login required.</p>
      </div>
      <SalaryExplorer filters={filters} />
    </div>
  )
}
```

### File: `src/components/SalaryExplorer.tsx`

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'

type Salary = {
  id: string; company: string; companySlug: string; tier: string
  role: string; level: string; levelDisplay: string; city: string
  baseSalary: number; bonus: number; esop: number; totalComp: number
  yoe: number; isVerified: boolean; submittedAt: string
}

type Filters = {
  companies: { name: string; slug: string }[]
  cities:    { name: string }[]
  levels:    { code: string; displayName: string }[]
}

const TIER_COLORS: Record<string, string> = {
  FAANG:           'bg-purple-100 text-purple-700',
  PRODUCT_STARTUP: 'bg-blue-100 text-blue-700',
  MNC:             'bg-green-100 text-green-700',
  IT_SERVICES:     'bg-gray-100 text-gray-600',
}

export default function SalaryExplorer({ filters }: { filters: Filters }) {
  const [salaries, setSalaries]   = useState<Salary[]>([])
  const [loading, setLoading]     = useState(true)
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [company, setCompany]     = useState('')
  const [level, setLevel]         = useState('')
  const [city, setCity]           = useState('')
  const [sortBy, setSortBy]       = useState<'totalComp' | 'baseSalary'>('totalComp')

  const fetchSalaries = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page:   String(page),
      limit:  '20',
      sortBy,
      sortOrder: 'desc',
    })
    if (company) params.set('company', company)
    if (level)   params.set('level',   level)
    if (city)    params.set('city',    city)

    const res  = await fetch(`/api/salaries?${params}`)
    const json = await res.json()
    setSalaries(json.data || [])
    setTotal(json.pagination?.total || 0)
    setLoading(false)
  }, [page, company, level, city, sortBy])

  useEffect(() => { fetchSalaries() }, [fetchSalaries])

  const handleFilter = () => { setPage(1); fetchSalaries() }

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
        <select value={company} onChange={e => { setCompany(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[150px]">
          <option value="">All Companies</option>
          {filters.companies.map(c => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select value={level} onChange={e => { setLevel(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[120px]">
          <option value="">All Levels</option>
          {filters.levels.map(l => (
            <option key={l.code} value={l.code}>{l.code} — {l.displayName}</option>
          ))}
        </select>

        <select value={city} onChange={e => { setCity(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[130px]">
          <option value="">All Cities</option>
          {filters.cities.map(c => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="totalComp">Sort: Total Comp</option>
          <option value="baseSalary">Sort: Base Salary</option>
        </select>

        <span className="ml-auto text-sm text-gray-400 self-center">
          {total} results
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Company', 'Level', 'City', 'YOE', 'Base (₹L)', 'Bonus (₹L)', 'ESOP (₹L)', 'Total TC (₹L)'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : salaries.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No results found</td></tr>
              ) : salaries.map(s => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.company}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TIER_COLORS[s.tier] || 'bg-gray-100 text-gray-600'}`}>
                      {s.tier.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{s.level}</span>
                    <div className="text-xs text-gray-400 mt-0.5">{s.levelDisplay}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.city}</td>
                  <td className="px-4 py-3 text-gray-600">{s.yoe}y</td>
                  <td className="px-4 py-3">{s.baseSalary.toFixed(1)}</td>
                  <td className="px-4 py-3 text-green-600">{s.bonus.toFixed(1)}</td>
                  <td className="px-4 py-3 text-blue-600">{s.esop.toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">{s.totalComp}</span>
                    {s.isVerified && (
                      <span className="ml-1.5 text-xs text-green-500 font-medium">✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50">
              Previous
            </button>
            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### File: `src/app/companies/page.tsx`

```typescript
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
  const res  = await fetch(`${process.env.NEXTAUTH_URL}/api/companies`, { cache: 'no-store' })
  const json = await res.json()
  return json.data as any[]
}

export default async function CompaniesPage() {
  const companies = await getCompanies()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Companies</h1>
      <p className="text-gray-500 mb-8">Browse compensation data by company</p>

      <div className="grid md:grid-cols-2 gap-4">
        {companies.map((c: any) => (
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
```

### File: `src/app/companies/[slug]/page.tsx`

```typescript
import { notFound } from 'next/navigation'
import ProgressionChart from '@/components/ProgressionChart'

async function getCompany(slug: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/companies/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function CompanyPage({ params }: { params: { slug: string } }) {
  const data = await getCompany(params.slug)
  if (!data) notFound()

  const { company, progression, cityBreakdown, totalDataPoints } = data

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <span className="text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
            {company.tier.replace('_', ' ')}
          </span>
        </div>
        <p className="text-gray-500">{company.industry} · {totalDataPoints} data points</p>
      </div>

      {/* Level ladder table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Compensation by Level</h2>
          <p className="text-sm text-gray-400 mt-0.5">All figures in ₹L per annum</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Level', 'Title', 'Median Base', 'Median Bonus', 'Median ESOP', 'Median TC', 'P25 – P75', 'Samples'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {progression.map((l: any) => (
                <tr key={l.levelCode} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono text-xs bg-gray-50 font-medium">{l.levelCode}</td>
                  <td className="px-4 py-3 text-gray-600">{l.levelDisplay}</td>
                  <td className="px-4 py-3">{l.medianBase}</td>
                  <td className="px-4 py-3 text-green-600">{l.medianBonus}</td>
                  <td className="px-4 py-3 text-blue-600">{l.medianEsop}</td>
                  <td className="px-4 py-3 font-bold">{l.medianTC}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{l.p25TC} – {l.p75TC}</td>
                  <td className="px-4 py-3 text-gray-400">{l.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progression chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h2 className="font-semibold mb-4">Career Progression Chart</h2>
        <ProgressionChart data={progression} />
      </div>

      {/* City breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4">Data by City</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(cityBreakdown).map(([city, count]) => (
            <div key={city} className="bg-gray-50 rounded-lg px-4 py-2 text-sm">
              <span className="font-medium">{city}</span>
              <span className="text-gray-400 ml-2">{count as number} entries</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### File: `src/components/ProgressionChart.tsx`

```typescript
'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts'

type Level = {
  levelCode: string; levelDisplay: string
  medianTC: number; p25TC: number; p75TC: number
  medianBase: number; medianBonus: number; medianEsop: number
}

export default function ProgressionChart({ data }: { data: Level[] }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-400 text-sm">No progression data available.</p>
  }

  const chartData = data.map(l => ({
    level:  l.levelCode,
    'Median TC':   l.medianTC,
    'Base':        l.medianBase,
    'Bonus':       l.medianBonus,
    'ESOP':        l.medianEsop,
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 mb-3">Total compensation growth across levels (₹L)</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="level" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => [`₹${v}L`, '']} />
            <Legend />
            <Area type="monotone" dataKey="Median TC" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-3">Compensation breakdown by component (₹L)</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="level" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => [`₹${v}L`, '']} />
            <Legend />
            <Area type="monotone" dataKey="Base"  stroke="#64748b" fill="#f1f5f9" strokeWidth={1.5} stackId="1" />
            <Area type="monotone" dataKey="Bonus" stroke="#16a34a" fill="#dcfce7" strokeWidth={1.5} stackId="1" />
            <Area type="monotone" dataKey="ESOP"  stroke="#2563eb" fill="#dbeafe" strokeWidth={1.5} stackId="1" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

### File: `src/app/compare/page.tsx`

```typescript
import OfferComparator from '@/components/OfferComparator'

export default function ComparePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Compare Two Offers</h1>
      <p className="text-gray-500 mb-8">
        We adjust for city cost-of-living to show you the real winner.
        ₹40L in Pune is not the same as ₹40L in Bangalore.
      </p>
      <OfferComparator />
    </div>
  )
}
```

### File: `src/components/OfferComparator.tsx`

```typescript
'use client'
import { useState } from 'react'

type Offer = {
  companyName: string; role: string; level: string; city: string
  baseSalary: number; bonus: number; esop: number; esopVesting: number
}

type Result = {
  offerA: Offer & { totalComp: number; adjustedTC: number; costIndex: number; vsMarket: number }
  offerB: Offer & { totalComp: number; adjustedTC: number; costIndex: number; vsMarket: number }
  winner: 'A' | 'B' | 'TIE'
  summary: string
}

const CITIES   = ['Bangalore', 'Hyderabad', 'Pune', 'Delhi NCR', 'Mumbai', 'Chennai']
const LEVELS   = ['L3','L4','L5','L6','L7','SDE1','SDE2','SDE3','STAFF','PRINC','ANALYST','SR_ANALYST','CONSULTANT']

const emptyOffer = (): Offer => ({
  companyName: '', role: 'Software Engineer', level: 'SDE2',
  city: 'Bangalore', baseSalary: 0, bonus: 0, esop: 0, esopVesting: 4,
})

function OfferForm({
  label, offer, onChange,
}: {
  label: string
  offer: Offer
  onChange: (o: Offer) => void
}) {
  const set = (k: keyof Offer, v: string | number) =>
    onChange({ ...offer, [k]: v })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-lg mb-4">{label}</h2>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-500">Company name</label>
          <input type="text" value={offer.companyName}
            onChange={e => set('companyName', e.target.value)}
            placeholder="e.g. Razorpay"
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-500">Level</label>
            <select value={offer.level} onChange={e => set('level', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">City</label>
            <select value={offer.city} onChange={e => set('city', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-500">Base salary (₹L / year)</label>
          <input type="number" value={offer.baseSalary || ''}
            onChange={e => set('baseSalary', parseFloat(e.target.value) || 0)}
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-500">Annual bonus (₹L)</label>
            <input type="number" value={offer.bonus || ''}
              onChange={e => set('bonus', parseFloat(e.target.value) || 0)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Total ESOP grant (₹L)</label>
            <input type="number" value={offer.esop || ''}
              onChange={e => set('esop', parseFloat(e.target.value) || 0)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-500">Vesting period (years)</label>
          <select value={offer.esopVesting} onChange={e => set('esopVesting', parseInt(e.target.value))}
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            {[1, 2, 3, 4, 5].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

export default function OfferComparator() {
  const [offerA, setOfferA] = useState<Offer>(emptyOffer())
  const [offerB, setOfferB] = useState<Offer>(emptyOffer())
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function compare() {
    if (!offerA.baseSalary || !offerB.baseSalary) {
      setError('Please fill in base salary for both offers.')
      return
    }
    setError('')
    setLoading(true)
    const res  = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerA, offerB }),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setLoading(false); return }
    setResult(json)
    setLoading(false)
  }

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <OfferForm label="Offer A" offer={offerA} onChange={setOfferA} />
        <OfferForm label="Offer B" offer={offerB} onChange={setOfferB} />
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <button onClick={compare} disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Comparing...' : 'Compare Offers →'}
      </button>

      {result && (
        <div className="mt-6 bg-white rounded-xl border-2 border-blue-200 p-5">
          {/* Winner banner */}
          <div className={`rounded-lg p-4 mb-5 text-center ${result.winner === 'TIE' ? 'bg-gray-50' : 'bg-blue-50'}`}>
            {result.winner !== 'TIE' ? (
              <>
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  Offer {result.winner} Wins 🎉
                </div>
                <p className="text-gray-600 text-sm">{result.summary}</p>
              </>
            ) : (
              <div className="text-lg font-semibold text-gray-600">It&apos;s a tie — both offers are effectively equal</div>
            )}
          </div>

          {/* Side by side comparison */}
          <div className="grid grid-cols-3 text-sm">
            <div className="text-gray-500 font-medium space-y-3">
              <div className="h-8 flex items-center">Metric</div>
              {['Company','Level','City','Base (₹L)','Bonus (₹L)','ESOP annual (₹L)','Total TC (₹L)','CoL-adjusted TC','vs Market'].map(l => (
                <div key={l} className="h-8 flex items-center text-gray-400">{l}</div>
              ))}
            </div>
            {(['offerA', 'offerB'] as const).map((key, i) => {
              const o      = result[key] as any
              const isWin  = result.winner === (i === 0 ? 'A' : 'B')
              return (
                <div key={key} className={`space-y-3 ${isWin ? 'text-blue-700' : 'text-gray-700'}`}>
                  <div className={`h-8 flex items-center font-semibold ${isWin ? 'text-blue-700' : ''}`}>
                    Offer {i === 0 ? 'A' : 'B'} {isWin ? '✓' : ''}
                  </div>
                  {[
                    o.companyName, o.level, `${o.city} (CoL ${o.costIndex})`,
                    o.baseSalary, o.bonus, o.annualEsop, o.totalComp, o.adjustedTC,
                    `${o.vsMarket > 0 ? '+' : ''}${o.vsMarket}% vs market`,
                  ].map((v, idx) => (
                    <div key={idx} className={`h-8 flex items-center font-medium ${idx >= 4 ? 'font-bold' : ''}`}>
                      {v}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

### File: `src/app/percentile/page.tsx`

```typescript
import PercentileCalculator from '@/components/PercentileCalculator'

export default function PercentilePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Am I Underpaid?</h1>
      <p className="text-gray-500 mb-8">
        Enter your compensation details. We compare you against peers at the same level
        with similar years of experience.
      </p>
      <PercentileCalculator />
    </div>
  )
}
```

### File: `src/components/PercentileCalculator.tsx`

```typescript
'use client'
import { useState } from 'react'

const CITIES = ['Bangalore', 'Hyderabad', 'Pune', 'Delhi NCR', 'Mumbai', 'Chennai']
const LEVELS = ['L3','L4','L5','L6','L7','SDE1','SDE2','SDE3','STAFF','PRINC','ANALYST','SR_ANALYST','CONSULTANT']

type Result = {
  percentile: number
  userTC:     number
  adjustedTC: number
  costIndex:  number
  verdict:    string
  peers: { count: number; p25: number; median: number; p75: number; highest: number }
}

export default function PercentileCalculator() {
  const [form, setForm]     = useState({ baseSalary: '', bonus: '0', esop: '0', level: 'SDE2', city: 'Bangalore', yoe: '' })
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function calculate() {
    if (!form.baseSalary || !form.yoe) { setError('Please fill in base salary and years of experience.'); return }
    setError('')
    setLoading(true)
    const res  = await fetch('/api/percentile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseSalary: parseFloat(form.baseSalary),
        bonus:      parseFloat(form.bonus)  || 0,
        esop:       parseFloat(form.esop)   || 0,
        level:      form.level,
        city:       form.city,
        yoe:        parseInt(form.yoe),
      }),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setLoading(false); return }
    setResult(json)
    setLoading(false)
  }

  const verdictColor =
    result?.verdict === 'Above market'               ? 'text-green-600' :
    result?.verdict === 'At market'                  ? 'text-blue-600'  :
    result?.verdict === 'Below market'               ? 'text-orange-500':
    'text-red-500'

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm text-gray-500">Base salary (₹L per year) *</label>
            <input type="number" value={form.baseSalary} onChange={e => set('baseSalary', e.target.value)}
              placeholder="e.g. 35" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Annual bonus (₹L)</label>
            <input type="number" value={form.bonus} onChange={e => set('bonus', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Annual ESOP value (₹L)</label>
            <input type="number" value={form.esop} onChange={e => set('esop', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Your level *</label>
            <select value={form.level} onChange={e => set('level', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">City *</label>
            <select value={form.city} onChange={e => set('city', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-gray-500">Years of experience *</label>
            <input type="number" value={form.yoe} onChange={e => set('yoe', e.target.value)}
              placeholder="e.g. 4" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <button onClick={calculate} disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Calculating...' : 'Calculate My Percentile →'}
      </button>

      {result && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          {/* Big percentile */}
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-blue-600 mb-1">{result.percentile}<span className="text-2xl">th</span></div>
            <div className="text-gray-500 mb-2">percentile among peers at your level</div>
            <span className={`text-lg font-semibold ${verdictColor}`}>{result.verdict}</span>
          </div>

          {/* Progress bar */}
          <div className="bg-gray-100 rounded-full h-3 mb-6">
            <div className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${result.percentile}%` }} />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Your TC', value: `₹${result.userTC}L` },
              { label: `CoL-adjusted (Bangalore base)`, value: `₹${result.adjustedTC}L` },
              { label: 'Market P25', value: `₹${result.peers.p25}L` },
              { label: 'Market median', value: `₹${result.peers.median}L` },
              { label: 'Market P75', value: `₹${result.peers.p75}L` },
              { label: 'Peer sample size', value: `${result.peers.count} people` },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-lg px-4 py-3">
                <div className="text-xs text-gray-400">{s.label}</div>
                <div className="font-semibold text-sm mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>

          {result.percentile < 50 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
              💡 To reach the market median (₹{result.peers.median}L), you would need a{' '}
              <strong>₹{Math.max(0, result.peers.median - result.userTC).toFixed(1)}L increase</strong>.
              Consider requesting a raise or exploring competing offers.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### File: `src/app/submit/page.tsx`

```typescript
import SubmitForm from '@/components/SubmitForm'

export default function SubmitPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Submit Your Salary</h1>
      <p className="text-gray-500 mb-2">
        Help the community by anonymously sharing your compensation data.
        Login required to prevent spam — your identity is never shown.
      </p>
      <SubmitForm />
    </div>
  )
}
```

### File: `src/components/SubmitForm.tsx`

```typescript
'use client'
import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'

const COMPANIES = ['google','meta','amazon','microsoft','flipkart','swiggy','zomato','razorpay','cred','phonepe','freshworks','tcs','infosys','wipro']
const CITIES    = ['Bangalore','Hyderabad','Pune','Delhi NCR','Mumbai','Chennai']
const LEVELS    = ['L3','L4','L5','L6','L7','SDE1','SDE2','SDE3','STAFF','PRINC','ANALYST','SR_ANALYST','CONSULTANT']

export default function SubmitForm() {
  const { data: session } = useSession()
  const [form, setForm]   = useState({ companySlug: 'google', levelCode: 'SDE2', cityName: 'Bangalore', baseSalary: '', bonus: '0', esop: '0', yoe: '' })
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  if (!session) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500 mb-4">Please sign in to submit your salary data.</p>
        <button onClick={() => signIn()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700">
          Sign in
        </button>
      </div>
    )
  }

  async function submit() {
    if (!form.baseSalary || !form.yoe) { setError('Please fill all required fields.'); return }
    setError('')
    setLoading(true)
    const res  = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companySlug: form.companySlug,
        levelCode:   form.levelCode,
        cityName:    form.cityName,
        baseSalary:  parseFloat(form.baseSalary),
        bonus:       parseFloat(form.bonus)  || 0,
        esop:        parseFloat(form.esop)   || 0,
        yoe:         parseInt(form.yoe),
      }),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <h2 className="font-semibold text-green-700 text-lg mb-1">Thank you!</h2>
        <p className="text-green-600 text-sm">Your salary has been submitted and will help thousands of engineers know their worth.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-500">Company *</label>
          <select value={form.companySlug} onChange={e => set('companySlug', e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm capitalize">
            {COMPANIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-500">Your level *</label>
            <select value={form.levelCode} onChange={e => set('levelCode', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">City *</label>
            <select value={form.cityName} onChange={e => set('cityName', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-500">Base salary (₹L / year) *</label>
          <input type="number" value={form.baseSalary} onChange={e => set('baseSalary', e.target.value)}
            placeholder="e.g. 35" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-500">Annual bonus (₹L)</label>
            <input type="number" value={form.bonus} onChange={e => set('bonus', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Annual ESOP (₹L)</label>
            <input type="number" value={form.esop} onChange={e => set('esop', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-500">Years of experience *</label>
          <input type="number" value={form.yoe} onChange={e => set('yoe', e.target.value)}
            placeholder="e.g. 4" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button onClick={submit} disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Anonymously →'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Your email is never shown. Data is stored anonymously.
        </p>
      </div>
    </div>
  )
}
```

### File: `src/app/login/page.tsx`

```typescript
'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')

  async function handleLogin() {
    const res = await signIn('credentials', {
      email, password, redirect: false,
    })
    if (res?.error) setError('Invalid email or password.')
    else window.location.href = '/'
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6 text-center">Sign in to CompIQ</h1>

        <button onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 mb-4 flex items-center justify-center gap-2">
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700">
            Sign in
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          No account?{' '}
          <a href="/register" className="text-blue-600 hover:underline">Register here</a>
        </p>
      </div>
    </div>
  )
}
```

### File: `src/app/register/page.tsx`

```typescript
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const [form, setForm]   = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function register() {
    setLoading(true)
    const res  = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setLoading(false); return }
    // Auto sign in after register
    await signIn('credentials', { email: form.email, password: form.password, callbackUrl: '/' })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6 text-center">Create account</h1>
        <div className="space-y-3">
          <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={register} disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}
```

---

## PHASE 8 — Deploy to Vercel (20 min)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "feat: initial CompIQ build"
```

1. Go to https://github.com and create a new repository named `compiq`
2. Follow the instructions to push your code (copy-paste the commands GitHub shows you)

### Step 2: Deploy on Vercel

1. Go to https://vercel.com → Sign up with GitHub
2. Click **"Add New → Project"**
3. Import your `compiq` GitHub repository
4. Vercel auto-detects Next.js — click **Deploy**
5. It will fail because of missing env vars — that's OK

### Step 3: Add environment variables on Vercel

1. Go to your Vercel project → **Settings → Environment Variables**
2. Add each variable from your `.env` file:
   - `DATABASE_URL` → your Neon connection string
   - `NEXTAUTH_URL` → your Vercel URL (e.g. `https://compiq.vercel.app`)
   - `NEXTAUTH_SECRET` → the random string you generated
   - `GOOGLE_CLIENT_ID` → from Google Cloud
   - `GOOGLE_CLIENT_SECRET` → from Google Cloud
3. Click **Redeploy**

### Step 4: Add your Vercel URL to Google Cloud

1. Go back to Google Cloud Console → Credentials → your OAuth Client
2. Add `https://YOUR-APP.vercel.app/api/auth/callback/google` to Authorized redirect URIs
3. Save

### Step 5: Run seed on production

After deploying, you need to seed the production database. Run this locally (your `.env` points to Neon, so it will seed there):

```bash
npx prisma db seed
```

✅ Your app is live!

---

## Quick Reference: File Structure

```
compiq/
├── prisma/
│   ├── schema.prisma       ← database schema
│   └── seed.ts             ← 200+ sample records
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        ← home
│   │   ├── explore/page.tsx                ← salary explorer
│   │   ├── companies/page.tsx              ← company list
│   │   ├── companies/[slug]/page.tsx       ← company detail
│   │   ├── compare/page.tsx                ← offer comparator
│   │   ├── percentile/page.tsx             ← am I underpaid?
│   │   ├── submit/page.tsx                 ← submit salary
│   │   ├── login/page.tsx                  ← login
│   │   ├── register/page.tsx               ← register
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── register/route.ts
│   │       ├── salaries/route.ts
│   │       ├── companies/route.ts
│   │       ├── companies/[slug]/route.ts
│   │       ├── percentile/route.ts
│   │       ├── compare/route.ts
│   │       └── submit/route.ts
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Providers.tsx
│   │   ├── SalaryExplorer.tsx
│   │   ├── ProgressionChart.tsx
│   │   ├── OfferComparator.tsx
│   │   ├── PercentileCalculator.tsx
│   │   └── SubmitForm.tsx
│   └── lib/
│       ├── prisma.ts
│       └── auth.ts
└── .env
```

---

## Loom Video Script (7 minutes)

**Min 0–1: Intro**
"I built CompIQ — India's first level-first compensation intelligence platform.
The core insight: every other platform shows salary by title. But L4 at Google
and SDE2 at Razorpay are different levels. I normalize this."

**Min 1–2: Architecture**
Show schema.prisma. Talk about:
- Why Level is separate from Role (cross-company normalization)
- Why totalComp is computed, not stored
- Why missing bonus/esop defaults to 0 at the DB level

**Min 2–3: Salary Explorer**
Demo the filter + sort. Show it working without login.

**Min 3–4: Company Page**
Show the level ladder table + progression chart. Explain the p25/median/p75 calculation.

**Min 4–5: Offer Comparator**
Input two offers with different cities. Show the CoL adjustment explaining:
"₹40L in Pune has 25% more purchasing power than ₹40L in Bangalore"

**Min 5–6: Percentile Calculator**
Enter a salary, get a percentile. Explain the peer matching logic (same level ± 2 YOE).

**Min 6–7: Edge cases**
- "I reject salary submissions above ₹500L base — obvious outliers"
- "Company names are normalized via slug — prevents Google / google / Google Inc duplicates"
- "Users can browse everything without login — only submit requires auth"

---

## Common Errors and Fixes

| Error | Fix |
|-------|-----|
| `PrismaClientInitializationError` | Check DATABASE_URL in .env is correct |
| `Cannot find module 'recharts'` | Run `npm install recharts` again |
| `NEXTAUTH_URL` error | Make sure NEXTAUTH_URL is set in .env |
| Google OAuth not working | Check redirect URI matches exactly in Google Cloud |
| `Error: Cannot find module '@/lib/prisma'` | Check tsconfig.json has `"@/*": ["./src/*"]` in paths |
| Seed command fails | Make sure `npx prisma db push` was run first |

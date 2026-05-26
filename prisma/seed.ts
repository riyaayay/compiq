import { PrismaClient, Tier } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

// Force load the .env file so process.env.DATABASE_URL is populated
dotenv.config()

// Connect with explicit SSL (required by Neon)
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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
  cities.forEach((c: any) => { cityMap[c.name] = c.id })
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
  companies.forEach((c: any) => { companyMap[c.slug] = c.id })

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
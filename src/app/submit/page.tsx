import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SubmitForm from '@/components/SubmitForm'

async function getFormData() {
  const [companies, cities] = await Promise.all([
    prisma.company.findMany({
      select: { name: true, slug: true, tier: true },
      orderBy: { name: 'asc' },
    }),
    prisma.city.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return { companies, cities }
}

export default async function SubmitPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { companies, cities } = await getFormData()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Submit Your Salary</h1>
      <p className="text-gray-500 mb-8">
        Your submission is anonymous. Help other engineers in India make informed career decisions.
      </p>
      <SubmitForm companies={companies} cities={cities} />
    </div>
  )
}

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

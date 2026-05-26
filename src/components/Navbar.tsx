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

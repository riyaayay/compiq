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

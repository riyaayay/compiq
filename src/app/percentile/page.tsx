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

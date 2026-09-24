import { Suspense } from 'react'
import { ClientCreatorsPage } from '@/components/client-creators'

export default function FindCreatorsPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#12070B]" />}><ClientCreatorsPage /></Suspense>
}

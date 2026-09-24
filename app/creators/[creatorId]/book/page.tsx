import { CreatorBookingPage } from '@/components/creator-booking'

export default async function Page({ params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params
  return <CreatorBookingPage creatorId={creatorId} />
}

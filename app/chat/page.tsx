import { ClientChatPage } from '@/components/client-chat'
import { Suspense } from 'react'

export default function Page() {
	return <Suspense fallback={<main className="min-h-screen bg-[#12070B]" />}><ClientChatPage /></Suspense>
}

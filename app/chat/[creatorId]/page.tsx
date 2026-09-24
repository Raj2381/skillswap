import { ClientChatPage } from '@/components/client-chat'

export default async function Page({ params }: { params: Promise<{ creatorId: string }> }) {
	const { creatorId } = await params
	return <ClientChatPage initialCreatorId={creatorId} />
}

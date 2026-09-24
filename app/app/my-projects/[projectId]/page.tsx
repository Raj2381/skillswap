import { redirect } from 'next/navigation'

export default async function LegacyAppProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  redirect(`/projects/${projectId}`)
}

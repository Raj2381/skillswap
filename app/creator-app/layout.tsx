import { redirect } from 'next/navigation'

export default async function CreatorAppLayout({ children }: { children: React.ReactNode }) {
  redirect('/creator/workspace/dashboard')
}

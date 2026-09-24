import { ClientProjectsPage } from '@/components/client-projects'
import Link from 'next/link'

export default function Page() {
	return <div className="relative"><Link href="/work-history" className="fixed right-5 top-24 z-10 rounded-xl border border-[#6A2636] bg-[#250C14] px-4 py-2.5 text-sm text-[#E7A5B5] shadow-xl">Work history</Link><ClientProjectsPage /></div>
}

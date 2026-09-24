import Link from 'next/link'
import { notFound } from 'next/navigation'
import { creatorById, services } from '@/src/data/mock'

export default async function CreatorPreview({ params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params
  const creator = creatorById(creatorId)
  if (!creator) notFound()
  const creatorServices = services.filter((service) => service.creatorId === creator.id).slice(0, 3)
  return <main className="min-h-screen bg-[#12070B] px-5 py-10 text-[#FFF5F6]"><div className="mx-auto max-w-4xl"><Link href="/find-creators" className="text-sm text-[#D66A84]">← Back to creators</Link><section className="mt-12 rounded-3xl border border-[#3A101C] bg-[#250C14] p-7 md:p-10"><div className="flex flex-col gap-6 sm:flex-row sm:items-center"><img src={creator.avatar} alt={`${creator.name} profile`} className="size-24 rounded-3xl object-cover"/><div><p className="text-sm text-[#D66A84]">{creator.category}</p><h1 className="mt-2 text-4xl font-semibold">{creator.name}</h1><p className="mt-2 text-[#C7A7B0]">{creator.rating} rating · {creator.reviews} reviews</p></div></div><p className="mt-8 max-w-2xl leading-8 text-[#C7A7B0]">{creator.bio}</p><div className="mt-8 grid gap-4 md:grid-cols-3">{creatorServices.map((service) => <div key={service.id} className="rounded-2xl border border-[#3A101C] p-4"><h2 className="font-semibold">{service.title}</h2><p className="mt-2 text-sm text-[#9F8189]">From ₹{service.price.toLocaleString()}</p></div>)}</div><div className="mt-10 border-t border-[#3A101C] pt-7"><h2 className="text-xl font-semibold">Want to work with this creator?</h2><p className="mt-2 text-sm text-[#C7A7B0]">Log in to book a service and start your project.</p><Link href="/login" className="mt-5 inline-flex rounded-xl bg-[#A52546] px-5 py-3 text-sm font-semibold">Log in to continue</Link></div></section></div></main>
}

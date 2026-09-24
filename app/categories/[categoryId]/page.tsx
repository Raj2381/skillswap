import Link from 'next/link'
import { notFound } from 'next/navigation'
import { categories, creators, services } from '@/src/data/mock'

export default async function PublicCategory({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params
  const category = decodeURIComponent(categoryId)
  if (!categories.includes(category)) notFound()
  const matches = creators.filter((creator) => creator.category === category)
  return <main className="min-h-screen bg-[#12070B] px-5 py-10 text-[#FFF5F6]"><div className="mx-auto max-w-6xl"><Link href="/categories" className="text-sm text-[#D66A84]">← All categories</Link><div className="mt-14 max-w-2xl"><p className="text-sm uppercase tracking-[0.24em] text-[#D66A84]">Category</p><h1 className="mt-4 text-5xl font-semibold">{category}</h1><p className="mt-5 text-lg leading-8 text-[#C7A7B0]">Find the people and services to bring this part of your idea to life.</p></div><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{matches.map((creator) => <article key={creator.id} className="rounded-2xl border border-[#3A101C] bg-[#250C14] p-5"><div className="flex items-center gap-3"><img src={creator.avatar} alt="" className="size-12 rounded-xl object-cover"/><div><h2 className="font-semibold">{creator.name}</h2><p className="text-sm text-[#D66A84]">{creator.rating} rating</p></div></div><p className="mt-4 text-sm leading-6 text-[#C7A7B0]">{creator.bio}</p><Link href={`/creator-preview/${creator.id}`} className="mt-5 inline-flex rounded-xl bg-[#A52546] px-4 py-2.5 text-sm font-semibold">View profile</Link></article>)}{matches.length === 0 && <p className="text-[#C7A7B0]">New creators are joining soon.</p>}</div></div></main>
}

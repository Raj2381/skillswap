'use client'


import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { categories, creators, skills } from '@/src/data/mock'
import { Layout, CreatorCard, card } from '@/components/client-shell'

export default function CategoryPage({ params }: { params: { categoryId: string } }) {
  const category = decodeURIComponent(params.categoryId)
  const exists = categories.includes(category)
  if (!exists) notFound()

  const categoryCreators = creators.filter((creator) => creator.category === category)
  const categorySkills = skills.filter((skill) => categoryCreators.some((creator) => creator.skills.includes(skill)))

  return (
    <Layout title={category} back>
      <section className={`${card} p-6 md:p-8`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#D66A84]">EXPLORE SKILLS</p>
            <h2 className="mt-2 text-2xl font-semibold">Find specialists for your next project</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#C7A7B0]">
              Browse verified creators offering practical {category.toLowerCase()} services, then choose the right fit for your brief.
            </p>
          </div>
          <Link href="/find-creators" className="text-sm font-semibold text-[#D66A84] hover:text-[#F0A0B2]">
            View all creators
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {(categorySkills.length ? categorySkills : [category]).map((skill) => (
            <span key={skill} className="rounded-full border border-[#6A2636] px-3 py-1.5 text-xs text-[#D9A4B0]">{skill}</span>
          ))}
        </div>
      </section>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-[#9F8189]">{categoryCreators.length} creators available</p>
          <h2 className="mt-1 text-2xl font-semibold">Top {category} creators</h2>
        </div>
        <span className="hidden items-center gap-2 text-xs text-[#9F8189] sm:flex"><CheckCircle2 className="size-4 text-[#D66A84]" />Verified profiles included</span>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categoryCreators.map((creator) => <CreatorCard key={creator.id} creator={creator} />)}
      </div>
    </Layout>
  )
}


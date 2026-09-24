import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const deadline = typeof body.deadline === 'string' ? body.deadline : ''
  const creatorId = typeof body.creatorId === 'string' ? body.creatorId : ''
  const budget = Number(body.budget)
  if (!title || !description || !deadline || !creatorId || !Number.isFinite(budget) || budget < 0) {
    return NextResponse.json({ error: 'Title, description, creator, deadline, and a valid budget are required.' }, { status: 400 })
  }

  const { data: clientProfile, error: clientError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (clientError) return NextResponse.json({ error: 'Unable to verify your account.' }, { status: 500 })
  if (clientProfile?.role !== 'client') return NextResponse.json({ error: 'Only client accounts can send service requests.' }, { status: 403 })

  const { data, error } = await supabase.rpc('create_project_request', {
    p_creator_id: creatorId,
    p_service_id: typeof body.serviceId === 'string' ? body.serviceId : null,
    p_title: title,
    p_description: description,
    p_requirements: typeof body.requirements === 'string' ? body.requirements.trim() || null : null,
    p_category: typeof body.category === 'string' ? body.category.trim() || null : null,
    p_budget: budget,
    p_budget_type: body.budgetType === 'hourly' ? 'hourly' : 'fixed',
    p_deadline: deadline,
    p_start_date: typeof body.startDate === 'string' && body.startDate ? body.startDate : null,
    p_reference_links: typeof body.referenceLinks === 'string' ? body.referenceLinks.trim() || null : null,
    p_communication_preference: ['chat', 'email', 'both'].includes(body.communicationPreference) ? body.communicationPreference : 'chat',
  })

  if (error) {
    const errorCode = 'code' in error ? error.code : undefined
    console.error('Project request creation error:', { message: error.message, code: errorCode })
    return NextResponse.json({ error: errorCode === '23505' ? 'You already have a pending request with this creator and title.' : error.message.includes('unavailable') ? 'This creator is currently unavailable for new projects.' : 'Unable to send the project request.' }, { status: 400 })
  }
  return NextResponse.json({ request: data ? { id: data.id, status: data.status } : null }, { status: 201 })
}

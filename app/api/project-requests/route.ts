import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) console.error('Project request auth error:', authError)
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const deadline = typeof body.deadline === 'string' ? body.deadline : ''
  const creatorId = typeof body.creatorId === 'string' ? body.creatorId : ''
  const budget = Number(body.budget)
  if (!title || !description || !deadline || !creatorId || !Number.isFinite(budget) || budget <= 0) {
    return NextResponse.json({ error: 'Title, description, creator, deadline, and a valid budget are required.' }, { status: 400 })
  }

  if (!/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(creatorId)) {
    return NextResponse.json({ error: 'The selected creator is invalid.' }, { status: 400 })
  }

  const { data: clientProfile, error: clientError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (clientError) return NextResponse.json({ error: 'Unable to verify your account.' }, { status: 500 })
  if (clientProfile?.role !== 'client') return NextResponse.json({ error: 'Only client accounts can send service requests.' }, { status: 403 })

  const { data: creator, error: creatorError } = await supabase.from('profiles').select('id,role').eq('id', creatorId).maybeSingle()
  if (creatorError) {
    console.error('Creator verification error:', creatorError)
    return NextResponse.json({ error: 'Unable to verify the selected creator.' }, { status: 500 })
  }
  if (!creator || creator.role !== 'creator') return NextResponse.json({ error: 'The selected creator could not be found.' }, { status: 404 })

  const { data: creatorProfile, error: availabilityError } = await supabase.from('creator_profiles').select('availability').eq('user_id', creatorId).maybeSingle()
  if (availabilityError) {
    console.error('Creator availability verification error:', availabilityError)
    return NextResponse.json({ error: 'Unable to verify creator availability.' }, { status: 500 })
  }
  if (creatorProfile?.availability === 'busy' || creatorProfile?.availability === 'unavailable') {
    return NextResponse.json({ error: 'This creator is currently unavailable for new projects.' }, { status: 400 })
  }

  const payload = {
    client_id: user.id,
    creator_id: creatorId,
    service_id: typeof body.serviceId === 'string' ? body.serviceId : null,
    title,
    description,
    requirements: typeof body.requirements === 'string' ? body.requirements.trim() || null : null,
    category: typeof body.category === 'string' ? body.category.trim() || null : null,
    budget,
    budget_type: body.budgetType === 'hourly' ? 'hourly' : 'fixed',
    deadline,
    start_date: typeof body.startDate === 'string' && body.startDate ? body.startDate : null,
    reference_links: typeof body.referenceLinks === 'string' ? body.referenceLinks.trim() || null : null,
    communication_preference: ['chat', 'email', 'both'].includes(body.communicationPreference) ? body.communicationPreference : 'chat',
    status: 'pending',
  }

  let { data, error } = await supabase.rpc('create_project_request', {
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
    console.error('PROJECT REQUEST INSERT ERROR:', { message: error.message, details: 'details' in error ? error.details : undefined, hint: 'hint' in error ? error.hint : undefined, code: errorCode })
    console.error('PROJECT REQUEST PAYLOAD:', payload)
    console.error('CURRENT USER:', user)
    console.error('CREATOR ID:', creatorId)

    const legacyAvailabilityError = error.message.includes('Creator not found or unavailable') && !creatorProfile
    const missingRpcError = errorCode === 'PGRST202' || error.message.includes('create_project_request')
    if (legacyAvailabilityError || missingRpcError) {
      const directResult = await supabase.from('project_requests').insert(payload).select('id,status').single()
      if (!directResult.error) {
        await supabase.from('conversations').upsert({ client_id: user.id, creator_id: creatorId }, { onConflict: 'client_id,creator_id,project_id', ignoreDuplicates: true })
        data = directResult.data
        error = null
      } else {
        console.error('PROJECT REQUEST DIRECT INSERT ERROR:', { message: directResult.error.message, details: 'details' in directResult.error ? directResult.error.details : undefined, hint: 'hint' in directResult.error ? directResult.error.hint : undefined, code: 'code' in directResult.error ? directResult.error.code : undefined })
      }
    }
    if (error) return NextResponse.json({ error: errorCode === '23505' ? 'You already have a pending request with this creator and title.' : error.message.includes('unavailable') ? 'This creator is currently unavailable for new projects.' : 'Unable to send the project request.' }, { status: 400 })
  }
  return NextResponse.json({ request: data ? { id: data.id, status: data.status } : null }, { status: 201 })
}

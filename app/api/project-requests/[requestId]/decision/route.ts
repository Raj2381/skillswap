import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  const { requestId } = await context.params
  const body = await request.json().catch(() => null)
  const decision = body?.decision === 'accept' ? 'accept' : body?.decision === 'decline' ? 'decline' : null
  if (!decision) return NextResponse.json({ error: 'Decision must be accept or decline.' }, { status: 400 })

  if (decision === 'decline' && typeof body?.reason === 'string' && body.reason.trim()) {
    const { data: requestRow, error: requestError } = await supabase.from('project_requests').update({ status: 'declined', decline_reason: body.reason.trim() }).eq('id', requestId).eq('creator_id', user.id).eq('status', 'pending').select('id,client_id').maybeSingle()
    if (requestError || !requestRow) return NextResponse.json({ error: 'This request is no longer pending.' }, { status: 400 })
    await supabase.from('notifications').insert({ user_id: requestRow.client_id, type: 'request_declined', title: 'Project request declined', message: 'Your project request was declined.', request_id: requestId })
    return NextResponse.json({ result: requestRow })
  }
  const { data, error } = await supabase.rpc(decision === 'accept' ? 'accept_project_request' : 'decline_project_request', { request_id: requestId })
  if (error) {
    console.error('Project request decision error:', { message: error.message, code: error.code, details: error.details })
    return NextResponse.json({ error: error.message.includes('no longer pending') ? 'This request has already been decided.' : 'Unable to update this project request.' }, { status: 400 })
  }
  return NextResponse.json({ result: data })
}

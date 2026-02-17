import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const body = await request.json().catch(() => ({}))
  const issueId = typeof body.issueId === 'string' ? body.issueId.trim() : ''
  const status = typeof body.status === 'string' ? body.status.trim() : ''

  if (!issueId || !status) {
    return NextResponse.json(
      { error: 'Issue and status are required.' },
      { status: 400 }
    )
  }

  const { data: issue } = await supabase
    .from('issues')
    .select('id, reporter_id, project_id')
    .eq('id', issueId)
    .single()

  if (!issue) {
    return NextResponse.json({ error: 'Issue not found.' }, { status: 404 })
  }

  if (profile?.role !== 'admin') {
    const { data: membership } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('project_id', issue.project_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error: updateError } = await supabase
    .from('issues')
    .update({ status })
    .eq('id', issueId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

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

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const sprintId = typeof body.sprintId === 'string' ? body.sprintId.trim() : ''
  const status = typeof body.status === 'string' ? body.status.trim() : ''
  const projectId =
    typeof body.projectId === 'string' ? body.projectId.trim() : ''

  if (!sprintId || !status) {
    return NextResponse.json(
      { error: 'Sprint and status are required.' },
      { status: 400 }
    )
  }

  if (!['planned', 'active', 'closed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }

  if (status === 'active' && projectId) {
    await supabase
      .from('sprints')
      .update({ status: 'closed' })
      .eq('project_id', projectId)
      .eq('status', 'active')
      .neq('id', sprintId)
  }

  const { error: updateError } = await supabase
    .from('sprints')
    .update({ status })
    .eq('id', sprintId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

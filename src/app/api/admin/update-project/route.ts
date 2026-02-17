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
  const projectId =
    typeof body.projectId === 'string' ? body.projectId.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description =
    typeof body.description === 'string' ? body.description.trim() : ''
  const memberIds = Array.isArray(body.memberIds)
    ? body.memberIds.filter((id: unknown) => typeof id === 'string')
    : []

  if (!projectId || !name) {
    return NextResponse.json(
      { error: 'Project and name are required.' },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase
    .from('projects')
    .update({ name, description: description || null })
    .eq('id', projectId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  const { error: clearError } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)

  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 400 })
  }

  if (memberIds.length > 0) {
    const assignments = memberIds.map((memberId: string) => ({
      project_id: projectId,
      user_id: memberId,
    }))
    const { error: assignError } = await supabase
      .from('project_members')
      .insert(assignments)
    if (assignError) {
      return NextResponse.json({ error: assignError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}

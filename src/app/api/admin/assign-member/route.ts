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
  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''

  if (!projectId || !userId) {
    return NextResponse.json(
      { error: 'Project and user are required.' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('project_members')
    .upsert({ project_id: projectId, user_id: userId }, { onConflict: 'project_id,user_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

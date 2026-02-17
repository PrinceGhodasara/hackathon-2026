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
  const goal = typeof body.goal === 'string' ? body.goal.trim() : ''
  const startDate =
    typeof body.startDate === 'string' ? body.startDate.trim() : null
  const endDate =
    typeof body.endDate === 'string' ? body.endDate.trim() : null

  if (!projectId || !name) {
    return NextResponse.json(
      { error: 'Project and name are required.' },
      { status: 400 }
    )
  }

  const { error } = await supabase.from('sprints').insert({
    project_id: projectId,
    name,
    goal: goal || null,
    start_date: startDate,
    end_date: endDate,
    status: 'planned',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

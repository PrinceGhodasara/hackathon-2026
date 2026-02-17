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

  const body = await request.json().catch(() => ({}))
  const issueId = typeof body.issueId === 'string' ? body.issueId.trim() : ''
  const workDate =
    typeof body.workDate === 'string' ? body.workDate.trim() : ''
  const hours =
    typeof body.hours === 'number' && Number.isFinite(body.hours)
      ? body.hours
      : null
  const note = typeof body.note === 'string' ? body.note.trim() : ''

  if (!issueId || !workDate || !hours) {
    return NextResponse.json(
      { error: 'Issue, date, and hours are required.' },
      { status: 400 }
    )
  }

  if (hours <= 0 || hours > 24) {
    return NextResponse.json(
      { error: 'Hours must be between 0 and 24.' },
      { status: 400 }
    )
  }

  const { error } = await supabase.from('issue_work_logs').insert({
    issue_id: issueId,
    logged_by: user.id,
    work_date: workDate,
    hours,
    note: note || null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

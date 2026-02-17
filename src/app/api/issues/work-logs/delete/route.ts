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
  const logId = typeof body.logId === 'string' ? body.logId.trim() : ''

  if (!logId) {
    return NextResponse.json(
      { error: 'Work log is required.' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('issue_work_logs')
    .delete()
    .eq('id', logId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

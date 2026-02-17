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
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const url = typeof body.url === 'string' ? body.url.trim() : ''

  if (!issueId || !title || !url) {
    return NextResponse.json(
      { error: 'Issue, title, and URL are required.' },
      { status: 400 }
    )
  }

  const { error } = await supabase.from('issue_attachments').insert({
    issue_id: issueId,
    uploaded_by: user.id,
    title,
    url,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

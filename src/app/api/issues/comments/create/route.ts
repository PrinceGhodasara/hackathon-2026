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
  const bodyText = typeof body.body === 'string' ? body.body.trim() : ''

  if (!issueId || !bodyText) {
    return NextResponse.json(
      { error: 'Issue and comment body are required.' },
      { status: 400 }
    )
  }

  const { error } = await supabase.from('issue_comments').insert({
    issue_id: issueId,
    author_id: user.id,
    body: bodyText,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

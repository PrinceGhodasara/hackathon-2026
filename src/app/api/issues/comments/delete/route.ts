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
  const commentId =
    typeof body.commentId === 'string' ? body.commentId.trim() : ''

  if (!commentId) {
    return NextResponse.json(
      { error: 'Comment is required.' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('issue_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

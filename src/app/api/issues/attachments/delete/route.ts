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
  const attachmentId =
    typeof body.attachmentId === 'string' ? body.attachmentId.trim() : ''
  const filePath =
    typeof body.filePath === 'string' ? body.filePath.trim() : ''

  if (!attachmentId) {
    return NextResponse.json(
      { error: 'Attachment is required.' },
      { status: 400 }
    )
  }

  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from('issue-attachments')
      .remove([filePath])

    if (storageError) {
      return NextResponse.json(
        { error: storageError.message },
        { status: 400 }
      )
    }
  }

  const { error } = await supabase
    .from('issue_attachments')
    .delete()
    .eq('id', attachmentId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

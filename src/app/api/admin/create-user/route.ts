import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
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
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { data: createdUser, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const userId = createdUser?.user?.id
    if (userId) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({ id: userId, email, role: 'member' }, { onConflict: 'id' })

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to create member.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

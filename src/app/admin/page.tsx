import { createClient } from '@/lib/supabase/server'
import SuperAdminPanel from '@/components/superadmin-panel'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, description')
    .order('created_at', { ascending: false })

  const { data: members } = await supabase
    .from('profiles')
    .select('id, email, role')
    .order('email')

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="bg-zinc-900 border-b border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800 text-sm font-semibold">
              SA
            </div>
            <span className="text-lg font-semibold">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-sm text-zinc-400 sm:block">
              {profile?.email || user.email}
            </div>
            <a
              href="/dashboard"
              className="text-sm text-zinc-400 transition hover:text-zinc-100"
            >
              Dashboard
            </a>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-zinc-400 transition hover:text-zinc-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <SuperAdminPanel members={members || []} projects={projects || []} />
      </main>
    </div>
  )
}

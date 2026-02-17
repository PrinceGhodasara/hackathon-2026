import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BoardsNav from '@/components/boards-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  const isAdmin = profile?.role === 'admin'
  if (!isAdmin) {
    redirect('/boards')
  }
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('created_at', { ascending: false })
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <aside className="w-[240px] border-r border-zinc-800 bg-zinc-900 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800 text-sm font-semibold">
              JM
            </div>
            <div>
              <p className="text-sm font-semibold">Jira Manager</p>
              <p
                className="text-xs text-zinc-400 truncate max-w-[160px]"
                title={profile?.email || user.email}
              >
                {profile?.email || user.email}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {isAdmin && (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-100 bg-zinc-800 border border-zinc-800"
              >
                <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent hover:border-zinc-800"
              >
                <FolderKanban className="h-4 w-4 text-zinc-400" />
                Projects
              </Link>
            </>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent hover:border-zinc-800"
            >
              <Users className="h-4 w-4 text-zinc-400" />
              User Management
            </Link>
          )}

          <BoardsNav projects={projects || []} />
        </nav>

        <div className="px-4 pb-6">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
            >
              <LogOut className="h-4 w-4 text-zinc-400" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-800 flex items-center px-6">
          <p className="text-sm text-zinc-400">Project: All Workstreams</p>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

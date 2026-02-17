import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function BoardsHomePage() {
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

  const { data: projects } = isAdmin
    ? await supabase
        .from('projects')
        .select('id, name, description')
        .order('created_at', { ascending: false })
    : await supabase
        .from('project_members')
        .select('project_id, projects(id, name, description)')
        .eq('user_id', user.id)

  const items = isAdmin
    ? (projects as { id: string; name: string; description: string | null }[]) || []
    : ((projects as { project_id: string; projects: { id: string; name: string; description: string | null } | null }[]) || [])
        .map((row) => row.projects)
        .filter((row): row is { id: string; name: string; description: string | null } => Boolean(row))

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Project Boards</h1>
            <p className="text-sm text-zinc-400">
              Open a board or manage backlog and sprints.
            </p>
          </div>
          <div className="text-sm text-zinc-400">
            Signed in as {profile?.email || user.email}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {items.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800 p-6 text-sm text-zinc-400">
            No projects available.
          </div>
        )}
        {items.map((project) => (
          <div
            key={project.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{project.name}</h2>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              {project.description || 'No description provided.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/boards/${project.id}`}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 hover:bg-zinc-800"
              >
                Open Board
              </Link>
              <Link
                href={`/boards/${project.id}/backlog`}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 hover:bg-zinc-800"
              >
                Backlog &amp; Sprints
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

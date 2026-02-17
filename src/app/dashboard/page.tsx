import { FolderKanban, Users, CalendarClock } from 'lucide-react'
import DashboardCharts from '@/components/dashboard-charts'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const { data: projects, count: projectCount } = await supabase
    .from('projects')
    .select('id, name, description', { count: 'exact' })
    .order('created_at', { ascending: false })

  const { count: memberCount } = isAdmin
    ? await supabase.from('profiles').select('id', { count: 'exact', head: true })
    : { count: null }

  const { data: roleCounts } = isAdmin
    ? await supabase.from('profiles').select('role, id')
    : { data: [] }

  const projectIds = (projects || []).map((project) => project.id)
  const { count: activeSprintCount } =
    projectIds.length > 0
      ? await supabase
          .from('sprints')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .in('project_id', projectIds)
      : { count: 0 }
  const { data: issuesForProjects } =
    projectIds.length > 0
      ? await supabase
          .from('issues')
          .select('id, project_id')
          .in('project_id', projectIds)
      : { data: [] }

  const issueIdToProject = new Map<string, string>()
  ;(issuesForProjects || []).forEach((issue) => {
    issueIdToProject.set(issue.id, issue.project_id)
  })

  const issueIds = (issuesForProjects || []).map((issue) => issue.id)
  const { data: workLogs } =
    issueIds.length > 0
      ? await supabase
          .from('issue_work_logs')
          .select('issue_id, hours')
          .in('issue_id', issueIds)
      : { data: [] }

  const hoursByProjectMap = (workLogs || []).reduce<Record<string, number>>(
    (acc, log) => {
      const projectId = issueIdToProject.get(log.issue_id)
      if (!projectId) return acc
      acc[projectId] = (acc[projectId] || 0) + (log.hours || 0)
      return acc
    },
    {}
  )

  const hoursByProject = (projects || []).map((project) => ({
    name: project.name,
    value: Number((hoursByProjectMap[project.id] || 0).toFixed(2)),
  }))

  const membersByRole = ['admin', 'member'].map((role) => ({
    name: role,
    value: (roleCounts || []).filter((member) => member.role === role).length,
  }))

  const projectLabel = 'All Projects'

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Portfolio Overview</h1>
            <p className="text-sm text-zinc-400">
              Track delivery across projects and teams.
            </p>
          </div>
          <div className="text-sm text-zinc-400">
            Signed in as {profile?.email || user.email}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-800 p-5 transition hover:-translate-y-0.5 hover:border-emerald-500/60 hover:shadow-[0_10px_30px_-20px_rgba(16,185,129,0.7)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Projects</p>
            <FolderKanban className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{projectCount ?? 0}</p>
          <p className="mt-2 text-xs text-zinc-400">
            {isAdmin ? 'Total active projects' : 'Assigned projects'}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-800 p-5 transition hover:-translate-y-0.5 hover:border-emerald-500/60 hover:shadow-[0_10px_30px_-20px_rgba(16,185,129,0.7)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Employees</p>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {memberCount ?? 'N/A'}
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            {isAdmin ? 'Active accounts in org' : 'Restricted view'}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-800 p-5 transition hover:-translate-y-0.5 hover:border-emerald-500/60 hover:shadow-[0_10px_30px_-20px_rgba(16,185,129,0.7)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Active Sprints</p>
            <CalendarClock className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {activeSprintCount ?? 0}
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Currently running sprints
          </p>
        </div>
      </section>

      <DashboardCharts
        membersByRole={membersByRole}
        hoursByProject={hoursByProject}
        projectLabel={projectLabel}
      />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          <span className="text-sm text-zinc-400">
            {projects && projects.length > 0
              ? `${projects.length} visible`
              : 'No projects yet'}
          </span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(projects || []).slice(0, 4).map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <h3 className="text-base font-semibold">{project.name}</h3>
              <p className="mt-2 text-sm text-zinc-400">
                {project.description || 'No description provided.'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

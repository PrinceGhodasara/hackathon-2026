import BacklogPanel from '@/components/backlog-panel'
import { createClient } from '@/lib/supabase/server'

type BacklogPageProps = {
  params: Promise<{ id: string }>
}

export default async function BacklogPage({ params }: BacklogPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    : { data: null }

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, description')
    .eq('id', id)
    .single()

  if (!project) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6 text-zinc-400">
        Project not found.
      </div>
    )
  }

  const { data: sprints } = await supabase
    .from('sprints')
    .select('id, name, goal, start_date, end_date, status, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const { data: backlogIssues } = await supabase
    .from('issues')
    .select(
      'id, title, priority, type, status, reporter_id, sprint_id, story_points'
    )
    .eq('project_id', id)
    .is('sprint_id', null)
    .order('created_at', { ascending: false })

  const backlogIssueIds = (backlogIssues || []).map((issue) => issue.id)
  const { data: issueAssignees } =
    backlogIssueIds.length > 0
      ? await supabase
          .from('issue_assignees')
          .select('issue_id, user_id')
          .in('issue_id', backlogIssueIds)
      : { data: [] }

  const { data: memberLinks } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', id)

  const memberIds = memberLinks?.map((link) => link.user_id) || []
  const { data: members } =
    memberIds.length > 0
      ? await supabase.from('profiles').select('id, email, role').in('id', memberIds)
      : { data: [] }

  const sprintIds = (sprints || []).map((sprint) => sprint.id)
  const { data: sprintIssues } =
    sprintIds.length > 0
      ? await supabase
          .from('issues')
          .select('id, sprint_id')
          .in('sprint_id', sprintIds)
      : { data: [] }

  const sprintIssueCounts = (sprintIssues || []).reduce<Record<string, number>>(
    (acc, issue) => {
      if (!issue.sprint_id) return acc
      acc[issue.sprint_id] = (acc[issue.sprint_id] || 0) + 1
      return acc
    },
    {}
  )

  const currentUserRole = profile?.role === 'admin' ? 'admin' : 'member'

  return (
    <BacklogPanel
      projectId={project.id}
      projectName={project.name}
      projectDescription={project.description}
      sprints={sprints || []}
      sprintIssueCounts={sprintIssueCounts}
      backlogIssues={backlogIssues || []}
      issueAssignees={issueAssignees || []}
      members={members || []}
      currentUserRole={currentUserRole}
    />
  )
}

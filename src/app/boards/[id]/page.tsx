import Link from 'next/link'
import BoardIssues from '@/components/board-issues'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type BoardPageProps = {
  params: { id: string }
  searchParams?: { sprint?: string }
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
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
    .eq('id', params.id)
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
    .select('id, name, status, created_at')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  const sprintParam = typeof searchParams?.sprint === 'string' ? searchParams?.sprint : ''
  const selectedSprint =
    (sprints || []).find((sprint) => sprint.id === sprintParam) ||
    (sprints || []).find((sprint) => sprint.status === 'active') ||
    (sprints || [])[0]

  if (!selectedSprint) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6">
        <h2 className="text-lg font-semibold">No sprints yet</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Create a sprint from the backlog to see issues on the board.
        </p>
        <Link
          href={`/boards/${project.id}/backlog`}
          className="mt-4 inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800"
        >
          Open Backlog
        </Link>
      </div>
    )
  }

  const { data: issues } = await supabase
    .from('issues')
    .select(
      'id, title, description, status, priority, type, reporter_id, sprint_id, story_points, complexity, due_date'
    )
    .eq('project_id', params.id)
    .eq('sprint_id', selectedSprint.id)
    .order('created_at', { ascending: false })

  const issueIds = (issues || []).map((issue) => issue.id)
  const { data: issueAssignees } =
    issueIds.length > 0
      ? await supabase
          .from('issue_assignees')
          .select('issue_id, user_id')
          .in('issue_id', issueIds)
      : { data: [] }

  const { data: issueComments } =
    issueIds.length > 0
      ? await supabase
          .from('issue_comments')
          .select('id, issue_id, author_id, body, created_at')
          .in('issue_id', issueIds)
          .order('created_at', { ascending: false })
      : { data: [] }

  const { data: issueWorkLogs } =
    issueIds.length > 0
      ? await supabase
          .from('issue_work_logs')
          .select('id, issue_id, logged_by, work_date, hours, note, created_at')
          .in('issue_id', issueIds)
          .order('created_at', { ascending: false })
      : { data: [] }

  const { data: issueAttachments } =
    issueIds.length > 0
      ? await supabase
          .from('issue_attachments')
          .select('id, issue_id, uploaded_by, title, url, created_at')
          .in('issue_id', issueIds)
          .order('created_at', { ascending: false })
      : { data: [] }

  const { data: memberLinks } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', params.id)

  const memberIds = memberLinks?.map((link) => link.user_id) || []
  const { data: members } =
    memberIds.length > 0
      ? await supabase.from('profiles').select('id, email, role').in('id', memberIds)
      : { data: [] }

  const commentAuthorIds = (issueComments || [])
    .map((comment) => comment.author_id)
    .filter((id): id is string => Boolean(id))
  const uniqueCommentAuthorIds = Array.from(new Set(commentAuthorIds))
  const { data: commentAuthors } =
    uniqueCommentAuthorIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, email, role')
          .in('id', uniqueCommentAuthorIds)
      : { data: [] }

  const workLogAuthorIds = (issueWorkLogs || [])
    .map((log) => log.logged_by)
    .filter((id): id is string => Boolean(id))
  const uniqueWorkLogAuthorIds = Array.from(new Set(workLogAuthorIds))
  const { data: workLogAuthors } =
    uniqueWorkLogAuthorIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, email, role')
          .in('id', uniqueWorkLogAuthorIds)
      : { data: [] }

  const currentUserId = user?.id || ''
  const currentUserRole = profile?.role === 'admin' ? 'admin' : 'member'

  return (
    <BoardIssues
      projectId={project.id}
      projectName={project.name}
      projectDescription={project.description}
      issues={issues || []}
      sprints={sprints || []}
      boardSprintId={selectedSprint.id}
      members={members || []}
      issueAssignees={issueAssignees || []}
      issueComments={issueComments || []}
      issueWorkLogs={issueWorkLogs || []}
      issueAttachments={issueAttachments || []}
      commentAuthors={commentAuthors || []}
      workLogAuthors={workLogAuthors || []}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
    />
  )
}

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const body = await request.json().catch(() => ({}))
  const issueId = typeof body.issueId === 'string' ? body.issueId.trim() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description =
    typeof body.description === 'string' ? body.description.trim() : ''
  const status = typeof body.status === 'string' ? body.status.trim() : 'todo'
  const priority =
    typeof body.priority === 'string' ? body.priority.trim() : 'medium'
  const type = typeof body.type === 'string' ? body.type.trim() : 'task'
  const storyPoints =
    typeof body.storyPoints === 'number' ? body.storyPoints : null
  const complexity =
    typeof body.complexity === 'string' ? body.complexity.trim() : 'medium'
  const dueDate =
    typeof body.dueDate === 'string' ? body.dueDate.trim() : null
  const sprintId =
    typeof body.sprintId === 'string' && body.sprintId.trim()
      ? body.sprintId.trim()
      : null
  const memberIds = Array.isArray(body.memberIds)
    ? body.memberIds.filter((id: unknown) => typeof id === 'string')
    : []

  if (!issueId || !title) {
    return NextResponse.json(
      { error: 'Issue and title are required.' },
      { status: 400 }
    )
  }

  const { data: issue } = await supabase
    .from('issues')
    .select('id, project_id, reporter_id')
    .eq('id', issueId)
    .single()

  if (!issue) {
    return NextResponse.json({ error: 'Issue not found.' }, { status: 404 })
  }

  if (profile?.role !== 'admin') {
    const { data: membership } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('project_id', issue.project_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (memberIds.length > 0) {
    const { data: projectMembers } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', issue.project_id)

    const allowed = new Set((projectMembers || []).map((m) => m.user_id))
    const filtered = memberIds.filter((id: string) => allowed.has(id))
    memberIds.length = 0
    filtered.forEach((id) => memberIds.push(id))
  }

  if (sprintId) {
    const { data: sprint } = await supabase
      .from('sprints')
      .select('id, project_id')
      .eq('id', sprintId)
      .single()
    if (!sprint || sprint.project_id !== issue.project_id) {
      return NextResponse.json({ error: 'Invalid sprint.' }, { status: 400 })
    }
  }

  const { error: updateError } = await supabase
    .from('issues')
    .update({
      title,
      description: description || null,
      status,
      priority,
      type,
      sprint_id: sprintId,
      story_points: storyPoints,
      complexity,
      due_date: dueDate || null,
    })
    .eq('id', issueId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  const { error: clearError } = await supabase
    .from('issue_assignees')
    .delete()
    .eq('issue_id', issueId)

  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 400 })
  }

  if (memberIds.length > 0) {
    const assignments = memberIds.map((memberId: string) => ({
      issue_id: issueId,
      user_id: memberId,
    }))
    const { error: assignError } = await supabase
      .from('issue_assignees')
      .insert(assignments)
    if (assignError) {
      return NextResponse.json({ error: assignError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}

'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bug, CheckSquare, BookOpen, Zap, Layers, Plus } from 'lucide-react'
import FullScreenLoader from '@/components/full-screen-loader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Sprint = {
  id: string
  name: string
  goal: string | null
  start_date: string | null
  end_date: string | null
  status: string
}

type Issue = {
  id: string
  title: string
  priority: string
  type: string
  status: string
  reporter_id: string | null
  sprint_id: string | null
  story_points: number | null
}

type Member = {
  id: string
  email: string | null
  role: 'admin' | 'member'
}

type IssueAssignee = {
  issue_id: string
  user_id: string
}

type BacklogPanelProps = {
  projectId: string
  projectName: string
  projectDescription: string | null
  sprints: Sprint[]
  sprintIssueCounts: Record<string, number>
  backlogIssues: Issue[]
  issueAssignees: IssueAssignee[]
  members: Member[]
  currentUserRole: 'admin' | 'member'
}

const typeStyles: Record<
  string,
  { label: string; bg: string; icon: string; Icon: typeof Bug }
> = {
  task: {
    label: 'Task',
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-300',
    Icon: CheckSquare,
  },
  bug: {
    label: 'Bug',
    bg: 'bg-red-500/10',
    icon: 'text-red-300',
    Icon: Bug,
  },
  story: {
    label: 'Story',
    bg: 'bg-green-500/10',
    icon: 'text-green-300',
    Icon: BookOpen,
  },
  spike: {
    label: 'Spike',
    bg: 'bg-purple-500/10',
    icon: 'text-purple-300',
    Icon: Zap,
  },
  epic: {
    label: 'Epic',
    bg: 'bg-sky-500/10',
    icon: 'text-sky-300',
    Icon: Layers,
  },
}

const typeOptions = ['task', 'bug', 'story', 'epic', 'spike']
const priorityOptions = ['low', 'medium', 'high', 'urgent']

const priorityIcons: Record<
  string,
  { count: number; color: string; label: string }
> = {
  low: { count: 1, color: 'text-sky-400', label: 'Low' },
  medium: { count: 2, color: 'text-yellow-400', label: 'Medium' },
  high: { count: 3, color: 'text-red-400', label: 'High' },
  urgent: { count: 3, color: 'text-red-500', label: 'Urgent' },
}

function PriorityIcon({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  const mapCountToWidth = (index: number) => {
    if (count >= 3) return 16
    if (count === 2) return index === 0 ? 12 : 16
    return index === 0 ? 10 : 0
  }

  return (
    <svg
      width="20"
      height="12"
      viewBox="0 0 20 12"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      {count >= 1 && (
        <rect x="2" y="1" width={mapCountToWidth(0)} height="2" rx="1" />
      )}
      {count >= 2 && (
        <rect x="2" y="5" width={mapCountToWidth(1)} height="2" rx="1" />
      )}
      {count >= 3 && <rect x="2" y="9" width="16" height="2" rx="1" />}
    </svg>
  )
}

export default function BacklogPanel({
  projectId,
  projectName,
  projectDescription,
  sprints,
  sprintIssueCounts,
  backlogIssues,
  issueAssignees,
  members,
  currentUserRole,
}: BacklogPanelProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false)
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [issuePriority, setIssuePriority] = useState('medium')
  const [issueType, setIssueType] = useState('task')
  const [issueStoryPoints, setIssueStoryPoints] = useState<number | null>(null)
  const [issueAssignee, setIssueAssignee] = useState('unassigned')
  const [sprintName, setSprintName] = useState('')
  const [sprintGoal, setSprintGoal] = useState('')
  const [sprintStart, setSprintStart] = useState('')
  const [sprintEnd, setSprintEnd] = useState('')

  const assigneesByIssue = useMemo(() => {
    return issueAssignees.reduce<Record<string, string[]>>((acc, item) => {
      if (!acc[item.issue_id]) acc[item.issue_id] = []
      acc[item.issue_id].push(item.user_id)
      return acc
    }, {})
  }, [issueAssignees])

  const getInitials = (value?: string | null) => {
    if (!value) return 'U'
    const cleaned = value.split('@')[0].replace(/[^a-zA-Z0-9]+/g, ' ').trim()
    const parts = cleaned.split(' ').filter(Boolean)
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase())
    return initials.join('') || 'U'
  }

  const handleCreateSprint = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!sprintName.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/sprints/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: sprintName.trim(),
          goal: sprintGoal.trim() || null,
          startDate: sprintStart || null,
          endDate: sprintEnd || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to create sprint.')
        toast.error(data.error || 'Unable to create sprint.')
        return
      }
      setIsCreateOpen(false)
      setSprintName('')
      setSprintGoal('')
      setSprintStart('')
      setSprintEnd('')
      toast.success('Sprint created.')
      router.refresh()
    } catch {
      setError('Unable to create sprint.')
      toast.error('Unable to create sprint.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSprintStatus = async (sprintId: string, status: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/sprints/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprintId, status, projectId }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to update sprint.')
        toast.error(data.error || 'Unable to update sprint.')
        return
      }
      toast.success(
        status === 'active' ? 'Sprint started.' : 'Sprint completed.'
      )
      router.refresh()
    } catch {
      setError('Unable to update sprint.')
      toast.error('Unable to update sprint.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMoveIssue = async (issueId: string, sprintId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/issues/update-sprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId,
          sprintId: sprintId === 'backlog' ? null : sprintId,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to update issue.')
        toast.error(data.error || 'Unable to update issue.')
        return
      }
      toast.success('Issue moved.')
      router.refresh()
    } catch {
      setError('Unable to update issue.')
      toast.error('Unable to update issue.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateIssue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!issueTitle.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/issues/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: issueTitle.trim(),
          description: issueDescription.trim(),
          status: 'todo',
          priority: issuePriority,
          type: issueType,
          storyPoints: issueStoryPoints,
          memberIds:
            issueAssignee && issueAssignee !== 'unassigned'
              ? [issueAssignee]
              : [],
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to create issue.')
        toast.error(data.error || 'Unable to create issue.')
        return
      }
      setIsCreateIssueOpen(false)
      setIssueTitle('')
      setIssueDescription('')
      setIssuePriority('medium')
      setIssueType('task')
      setIssueStoryPoints(null)
      setIssueAssignee('unassigned')
      toast.success('Backlog task created.')
      router.refresh()
    } catch {
      setError('Unable to create issue.')
      toast.error('Unable to create issue.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {isLoading && <FullScreenLoader label="Updating backlog..." />}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{projectName} Backlog</h1>
            <p className="mt-2 text-sm text-zinc-400">
              {projectDescription || 'Manage backlog and sprints.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => setIsCreateIssueOpen(true)}>
              <Plus className="h-4 w-4 text-zinc-400" />
              New Task
            </Button>
            {currentUserRole === 'admin' && (
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(true)}>
                Create Sprint
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sprints</h2>
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {sprints.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
              No sprints yet.
            </div>
          )}
          {sprints.map((sprint) => (
            <div
              key={sprint.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{sprint.name}</h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    {sprint.goal || 'No goal set'}
                  </p>
                </div>
                <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                  {sprint.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                <span>
                  {sprint.start_date ? `Start: ${sprint.start_date}` : 'No start'}
                </span>
                <span>
                  {sprint.end_date ? `End: ${sprint.end_date}` : 'No end'}
                </span>
                <span>{sprintIssueCounts[sprint.id] || 0} issues</span>
              </div>
              {currentUserRole === 'admin' && (
                <div className="mt-3 flex items-center gap-2">
                  {sprint.status === 'planned' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSprintStatus(sprint.id, 'active')}
                    >
                      Start sprint
                    </Button>
                  )}
                  {sprint.status === 'active' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSprintStatus(sprint.id, 'closed')}
                    >
                      Complete sprint
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6">
        <h2 className="text-lg font-semibold">Backlog</h2>
        <div className="mt-4 space-y-3">
          {backlogIssues.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
              No backlog issues.
            </div>
          )}
          {backlogIssues.map((issue) => {
            const style = typeStyles[issue.type] || typeStyles.task
            const priorityStyle =
              priorityIcons[issue.priority] || priorityIcons.medium
            const assigneeId = (assigneesByIssue[issue.id] || [])[0]
            const assigneeEmail =
              members.find((member) => member.id === assigneeId)?.email ||
              assigneeId
            return (
              <div
                key={issue.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        style.bg
                      )}
                    >
                      <style.Icon className={cn('h-4 w-4', style.icon)} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{issue.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                        <div
                          className="flex items-center"
                          title={`Priority: ${priorityStyle.label}`}
                        >
                          <PriorityIcon
                            count={priorityStyle.count}
                            className={priorityStyle.color}
                          />
                        </div>
                        {issue.story_points !== null && (
                          <span>{issue.story_points} pts</span>
                        )}
                        <span className="capitalize">{issue.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {assigneeEmail && (
                      <div
                        className="h-7 w-7 rounded-full bg-zinc-800 text-zinc-100 flex items-center justify-center text-[10px] font-semibold"
                        title={assigneeEmail}
                      >
                        {getInitials(assigneeEmail)}
                      </div>
                    )}
                    <Select
                      value="backlog"
                      onValueChange={(value) => handleMoveIssue(issue.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Send to sprint" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="backlog">Backlog</SelectItem>
                        {sprints.map((sprint) => (
                          <SelectItem key={sprint.id} value={sprint.id}>
                            {sprint.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Sprint</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg border border-zinc-800 bg-zinc-800 p-2"
              >
                <span className="sr-only">Close</span>
                <span className="text-zinc-400">✕</span>
              </button>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleCreateSprint}>
              <div>
                <label className="text-sm text-zinc-400">Sprint name</label>
                <input
                  value={sprintName}
                  onChange={(event) => setSprintName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm"
                  placeholder="Sprint 1"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Goal</label>
                <input
                  value={sprintGoal}
                  onChange={(event) => setSprintGoal(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm"
                  placeholder="Deliver onboarding updates"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-zinc-400">Start date</label>
                  <input
                    type="date"
                    value={sprintStart}
                    onChange={(event) => setSprintStart(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400">End date</label>
                  <input
                    type="date"
                    value={sprintEnd}
                    onChange={(event) => setSprintEnd(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create sprint</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateIssueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Backlog Task</h2>
              <button
                type="button"
                onClick={() => setIsCreateIssueOpen(false)}
                className="rounded-lg border border-zinc-800 bg-zinc-800 p-2"
              >
                <span className="sr-only">Close</span>
                <span className="text-zinc-400">✕</span>
              </button>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleCreateIssue}>
              <div>
                <label className="text-sm text-zinc-400">Title</label>
                <input
                  value={issueTitle}
                  onChange={(event) => setIssueTitle(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm"
                  placeholder="Add onboarding flow"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Description</label>
                <textarea
                  value={issueDescription}
                  onChange={(event) => setIssueDescription(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm"
                  placeholder="Describe what needs to be done"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-zinc-400">Type</label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">Priority</label>
                  <Select value={issuePriority} onValueChange={setIssuePriority}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400">Story points</label>
                  <input
                    type="number"
                    min={0}
                    value={issueStoryPoints ?? ''}
                    onChange={(event) =>
                      setIssueStoryPoints(
                        event.target.value === ''
                          ? null
                          : Number(event.target.value)
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400">Assignee</label>
                  <Select
                    value={issueAssignee}
                    onValueChange={(value) => setIssueAssignee(value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.email || member.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateIssueOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create task</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

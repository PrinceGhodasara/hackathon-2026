'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Bug, CheckSquare, BookOpen, Zap, Layers, Trash2 } from 'lucide-react'
import FullScreenLoader from '@/components/full-screen-loader'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Issue = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  type: string
  reporter_id: string | null
  sprint_id: string | null
  story_points: number | null
  complexity: string | null
  due_date: string | null
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

type IssueWorkLog = {
  id: string
  issue_id: string
  logged_by: string | null
  work_date: string
  hours: number
  note: string | null
  created_at: string
}

type IssueComment = {
  id: string
  issue_id: string
  author_id: string | null
  body: string
  created_at: string
}

type IssueAttachment = {
  id: string
  issue_id: string
  uploaded_by: string | null
  title: string
  url: string
  created_at: string
}

type BoardIssuesProps = {
  projectId: string
  projectName: string
  projectDescription: string | null
  issues: Issue[]
  sprints: {
    id: string
    name: string
    status: string
  }[]
  boardSprintId: string
  members: Member[]
  issueAssignees: IssueAssignee[]
  issueComments: IssueComment[]
  issueWorkLogs: IssueWorkLog[]
  issueAttachments: IssueAttachment[]
  commentAuthors: Member[]
  workLogAuthors: Member[]
  currentUserId: string
  currentUserRole: 'admin' | 'member'
}

const statusOptions = ['todo', 'in_progress', 'review', 'done']
const priorityOptions = ['low', 'medium', 'high', 'urgent']
const typeOptions = ['task', 'bug', 'story', 'epic', 'spike']
const complexityOptions = ['low', 'medium', 'high']

const typeStyles: Record<
  string,
  {
    label: string
    border: string
    bg: string
    icon: string
    Icon: typeof Bug
  }
> = {
  task: {
    label: 'Task',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-300',
    Icon: CheckSquare,
  },
  bug: {
    label: 'Bug',
    border: 'border-red-500/40',
    bg: 'bg-red-500/10',
    icon: 'text-red-300',
    Icon: Bug,
  },
  story: {
    label: 'Story',
    border: 'border-green-500/40',
    bg: 'bg-green-500/10',
    icon: 'text-green-300',
    Icon: BookOpen,
  },
  spike: {
    label: 'Spike',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    icon: 'text-purple-300',
    Icon: Zap,
  },
  epic: {
    label: 'Epic',
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    icon: 'text-sky-300',
    Icon: Layers,
  },
}

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

export default function BoardIssues({
  projectId,
  projectName,
  projectDescription,
  issues,
  sprints,
  boardSprintId,
  members,
  issueAssignees,
  issueComments,
  issueWorkLogs,
  issueAttachments,
  commentAuthors,
  workLogAuthors,
  currentUserId,
  currentUserRole,
}: BoardIssuesProps) {
  const router = useRouter()
  const [issueList, setIssueList] = useState<Issue[]>(issues)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [type, setType] = useState('task')
  const [sprintId, setSprintId] = useState('backlog')
  const [selectedBoardSprintId, setSelectedBoardSprintId] = useState(boardSprintId)
  const [storyPoints, setStoryPoints] = useState<number | null>(null)
  const [complexity, setComplexity] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [selectedMember, setSelectedMember] = useState<string>('unassigned')
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)
  const [commentBody, setCommentBody] = useState('')
  const [workDate, setWorkDate] = useState('')
  const [workHours, setWorkHours] = useState<number | null>(null)
  const [workNote, setWorkNote] = useState('')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const assigneesByIssue = useMemo(() => {
    return issueAssignees.reduce<Record<string, string[]>>((acc, item) => {
      if (!acc[item.issue_id]) acc[item.issue_id] = []
      acc[item.issue_id].push(item.user_id)
      return acc
    }, {})
  }, [issueAssignees])

  const commentsByIssue = useMemo(() => {
    return issueComments.reduce<Record<string, IssueComment[]>>(
      (acc, comment) => {
        if (!acc[comment.issue_id]) acc[comment.issue_id] = []
        acc[comment.issue_id].push(comment)
        return acc
      },
      {}
    )
  }, [issueComments])

  const workLogsByIssue = useMemo(() => {
    return issueWorkLogs.reduce<Record<string, IssueWorkLog[]>>(
      (acc, log) => {
        if (!acc[log.issue_id]) acc[log.issue_id] = []
        acc[log.issue_id].push(log)
        return acc
      },
      {}
    )
  }, [issueWorkLogs])

  const attachmentsByIssue = useMemo(() => {
    return issueAttachments.reduce<Record<string, IssueAttachment[]>>(
      (acc, item) => {
        if (!acc[item.issue_id]) acc[item.issue_id] = []
        acc[item.issue_id].push(item)
        return acc
      },
      {}
    )
  }, [issueAttachments])

  const commentAuthorById = useMemo(() => {
    return commentAuthors.reduce<Record<string, Member>>((acc, member) => {
      acc[member.id] = member
      return acc
    }, {})
  }, [commentAuthors])

  const workLogAuthorById = useMemo(() => {
    return workLogAuthors.reduce<Record<string, Member>>((acc, member) => {
      acc[member.id] = member
      return acc
    }, {})
  }, [workLogAuthors])

  const canLogHours =
    Boolean(editingId) &&
    (currentUserRole === 'admin' ||
      (editingId ? assigneesByIssue[editingId]?.includes(currentUserId) : false))

  const getInitials = (value?: string | null) => {
    if (!value) return 'U'
    const cleaned = value.split('@')[0].replace(/[^a-zA-Z0-9]+/g, ' ').trim()
    const parts = cleaned.split(' ').filter(Boolean)
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase())
    return initials.join('') || 'U'
  }

  useEffect(() => {
    setIssueList(issues)
  }, [issues])

  useEffect(() => {
    setSelectedBoardSprintId(boardSprintId)
  }, [boardSprintId])

  const openCreateModal = () => {
    const today = new Date().toISOString().slice(0, 10)
    setMode('create')
    setEditingId(null)
    setTitle('')
    setDescription('')
    setStatus('todo')
    setPriority('medium')
    setType('task')
    setSprintId(boardSprintId || 'backlog')
    setStoryPoints(null)
    setComplexity('medium')
    setDueDate('')
    setSelectedMember('unassigned')
    setCommentBody('')
    setWorkDate(today)
    setWorkHours(null)
    setWorkNote('')
    setError(null)
    setIsOpen(true)
  }

  const openEditModal = (issue: Issue) => {
    const today = new Date().toISOString().slice(0, 10)
    setMode('edit')
    setEditingId(issue.id)
    setTitle(issue.title)
    setDescription(issue.description || '')
    setStatus(issue.status)
    setPriority(issue.priority)
    setType(issue.type)
    setSprintId(issue.sprint_id || 'backlog')
    setStoryPoints(issue.story_points ?? null)
    setComplexity(issue.complexity || 'medium')
    setDueDate(issue.due_date || '')
    setSelectedMember((assigneesByIssue[issue.id] || [])[0] || 'unassigned')
    setCommentBody('')
    setWorkDate(today)
    setWorkHours(null)
    setWorkNote('')
    setError(null)
    setIsOpen(true)
  }

  const canEditIssue = true
  const isEditReadOnly = false

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (storyPoints !== null && storyPoints > 10) {
      setError('Story points cannot be more than 10.')
      return
    }
    setLoadingLabel(mode === 'edit' ? 'Saving issue...' : 'Creating issue...')
    setIsSubmitting(true)
    setIsLoading(true)

    try {
      const endpoint =
        mode === 'edit' ? '/api/issues/update' : '/api/issues/create'
      const payload =
        mode === 'edit'
          ? {
              issueId: editingId,
              title,
              description,
              status,
              priority,
              type,
              sprintId: sprintId === 'backlog' ? null : sprintId,
              storyPoints,
              complexity,
              dueDate: dueDate || null,
              memberIds:
                selectedMember && selectedMember !== 'unassigned'
                  ? [selectedMember]
                  : [],
            }
          : {
              projectId,
              title,
              description,
              status,
              priority,
              type,
              sprintId: sprintId === 'backlog' ? null : sprintId,
              storyPoints,
              complexity,
              dueDate: dueDate || null,
              memberIds:
                selectedMember && selectedMember !== 'unassigned'
                  ? [selectedMember]
                  : [],
            }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error || (mode === 'edit' ? 'Unable to save issue.' : 'Unable to create issue.')
        )
        toast.error(data.error || 'Unable to save issue.')
        return
      }

      setIsOpen(false)
      setTitle('')
      setDescription('')
      setStatus('todo')
      setPriority('medium')
      setType('task')
    setSprintId(boardSprintId || 'backlog')
      setStoryPoints(null)
      setComplexity('medium')
      setDueDate('')
      setSelectedMember('unassigned')
      setCommentBody('')
      setWorkDate(new Date().toISOString().slice(0, 10))
      setWorkHours(null)
      setWorkNote('')
      setEditingId(null)
      setMode('create')
      toast.success(mode === 'edit' ? 'Issue updated.' : 'Issue created.')
      router.refresh()
    } catch {
      setError(mode === 'edit' ? 'Unable to save issue.' : 'Unable to create issue.')
      toast.error(mode === 'edit' ? 'Unable to save issue.' : 'Unable to create issue.')
    } finally {
      setIsSubmitting(false)
      setIsLoading(false)
      setLoadingLabel(null)
    }
  }

  const handleStatusChange = async (issueId: string, status: string) => {
    if (!canEditIssue) return
    const existing = issueList.find((issue) => issue.id === issueId)
    if (!existing || existing.status === status) return

    const previousStatus = existing.status
    setIssueList((prev) =>
      prev.map((issue) =>
        issue.id === issueId ? { ...issue, status } : issue
      )
    )

    try {
      const response = await fetch('/api/issues/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, status }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to update status.')
      }
      toast.success('Issue status updated.')
      router.refresh()
    } catch (err: unknown) {
      setIssueList((prev) =>
        prev.map((issue) =>
          issue.id === issueId ? { ...issue, status: previousStatus } : issue
        )
      )
      const message =
        err instanceof Error ? err.message : 'Unable to update status.'
      setError(message)
      toast.error(message)
    }
  }

  const handleAddComment = async () => {
    if (!editingId || commentBody.trim() === '') return
    setLoadingLabel('Adding comment...')
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/issues/comments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: editingId, body: commentBody }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to add comment.')
        toast.error(data.error || 'Unable to add comment.')
        return
      }
      setCommentBody('')
      toast.success('Comment added.')
      router.refresh()
    } catch {
      setError('Unable to add comment.')
      toast.error('Unable to add comment.')
    } finally {
      setIsLoading(false)
      setLoadingLabel(null)
    }
  }

  const isAllowedFile = (file: File) => {
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const allowedExt = ['.doc', '.docx', '.xls', '.xlsx']
    const lower = file.name.toLowerCase()
    return (
      allowedTypes.includes(file.type) ||
      allowedExt.some((ext) => lower.endsWith(ext))
    )
  }

  const handleUploadAttachment = async () => {
    if (!editingId || !uploadFile) return
    if (!isAllowedFile(uploadFile)) {
      setError('Only Word or Excel files are allowed.')
      return
    }
    setLoadingLabel('Uploading attachment...')
    setIsUploading(true)
    setError(null)
    try {
      const supabase = createClient()
      const filePath = `issues/${editingId}/${Date.now()}-${uploadFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('issue-attachments')
        .upload(filePath, uploadFile, {
          upsert: false,
          contentType: uploadFile.type || 'application/octet-stream',
        })

      if (uploadError) {
        setError(uploadError.message)
        toast.error(uploadError.message)
        return
      }

      const { data } = supabase.storage
        .from('issue-attachments')
        .getPublicUrl(filePath)

      if (!data?.publicUrl) {
        setError('Unable to get public URL.')
        toast.error('Unable to get public URL.')
        return
      }

      const response = await fetch('/api/issues/attachments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: editingId,
          title: uploadFile.name,
          url: data.publicUrl,
        }),
      })
      const resp = await response.json()
      if (!response.ok) {
        setError(resp.error || 'Unable to add attachment.')
        toast.error(resp.error || 'Unable to add attachment.')
        return
      }

      setUploadFile(null)
      setIsUploadOpen(false)
      toast.success('Attachment added.')
      router.refresh()
    } catch {
      setError('Unable to upload attachment.')
      toast.error('Unable to upload attachment.')
    } finally {
      setIsUploading(false)
      setLoadingLabel(null)
    }
  }

  const extractAttachmentPath = (url: string) => {
    const marker = '/storage/v1/object/public/issue-attachments/'
    const index = url.indexOf(marker)
    if (index === -1) return ''
    return url.slice(index + marker.length)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!commentId) return
    setLoadingLabel('Deleting comment...')
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/issues/comments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to delete comment.')
        toast.error(data.error || 'Unable to delete comment.')
        return
      }
      toast.success('Comment deleted.')
      router.refresh()
    } catch {
      setError('Unable to delete comment.')
      toast.error('Unable to delete comment.')
    } finally {
      setIsLoading(false)
      setLoadingLabel(null)
    }
  }

  const handleDeleteAttachment = async (attachment: IssueAttachment) => {
    if (!attachment?.id) return
    setLoadingLabel('Deleting attachment...')
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/issues/attachments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachmentId: attachment.id,
          filePath: extractAttachmentPath(attachment.url),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to delete attachment.')
        toast.error(data.error || 'Unable to delete attachment.')
        return
      }
      toast.success('Attachment deleted.')
      router.refresh()
    } catch {
      setError('Unable to delete attachment.')
      toast.error('Unable to delete attachment.')
    } finally {
      setIsLoading(false)
      setLoadingLabel(null)
    }
  }

  const handleDeleteWorkLog = async (logId: string) => {
    if (!logId) return
    setLoadingLabel('Deleting work log...')
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/issues/work-logs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to delete work log.')
        toast.error(data.error || 'Unable to delete work log.')
        return
      }
      toast.success('Work log deleted.')
      router.refresh()
    } catch {
      setError('Unable to delete work log.')
      toast.error('Unable to delete work log.')
    } finally {
      setIsLoading(false)
      setLoadingLabel(null)
    }
  }

  const handleAddWorkLog = async () => {
    if (!editingId) return
    if (!workDate || workHours === null) return
    if (workHours <= 0 || workHours > 24) {
      setError('Hours must be between 0 and 24.')
      toast.error('Hours must be between 0 and 24.')
      return
    }
    setLoadingLabel('Logging hours...')
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/issues/work-logs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: editingId,
          workDate,
          hours: workHours,
          note: workNote,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to log hours.')
        toast.error(data.error || 'Unable to log hours.')
        return
      }
      setWorkHours(null)
      setWorkNote('')
      toast.success('Hours logged.')
      router.refresh()
    } catch {
      setError('Unable to log hours.')
      toast.error('Unable to log hours.')
    } finally {
      setIsLoading(false)
      setLoadingLabel(null)
    }
  }

  return (
    <div className="space-y-6">
      {isLoading && (
        <FullScreenLoader
          label={
            loadingLabel ||
            (mode === 'edit' ? 'Saving issue...' : 'Creating issue...')
          }
        />
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{projectName}</h1>
            <p className="mt-2 text-sm text-zinc-400">
              {projectDescription || 'No description provided.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[220px]">
              <Select
                value={selectedBoardSprintId}
                onValueChange={(value) => {
                  setSelectedBoardSprintId(value)
                  router.push(`/boards/${projectId}?sprint=${value}`)
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name} ({sprint.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={openCreateModal}>
              <Plus className="h-4 w-4 text-zinc-400" />
              New Task
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6">
        <h2 className="text-lg font-semibold">Issues</h2>
        {error && !isOpen && (
          <p className="mt-2 text-sm text-red-300">{error}</p>
        )}
        {issueList.length === 0 && (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
            No issues yet.
          </div>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          {statusOptions.map((statusKey) => (
            <div
              key={statusKey}
              className={cn(
                'rounded-xl border border-zinc-800 bg-zinc-900 p-3 min-h-[240px]',
                dragOverStatus === statusKey && 'border-zinc-600'
              )}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOverStatus(statusKey)
              }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(event) => {
                event.preventDefault()
                setDragOverStatus(null)
                const issueId = event.dataTransfer.getData('text/plain')
                handleStatusChange(issueId, statusKey)
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {statusKey.replace('_', ' ')}
                </p>
                <span className="text-xs text-zinc-500">
                  {issueList.filter((issue) => issue.status === statusKey).length}
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {issueList
                  .filter((issue) => issue.status === statusKey)
                  .map((issue) => {
                    const assignees = assigneesByIssue[issue.id] || []
                    const canEdit = canEditIssue
                    const canOpenIssue = true
                    const style = typeStyles[issue.type] || typeStyles.task
                    const primaryAssigneeId = assignees[0]
                    const primaryAssigneeEmail =
                      members.find((member) => member.id === primaryAssigneeId)
                        ?.email || primaryAssigneeId
                    return (
                      <div
                        key={issue.id}
                        draggable={canEdit}
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/plain', issue.id)
                        }}
                        onClick={() => (canOpenIssue ? openEditModal(issue) : null)}
                        className={cn(
                          'rounded-lg border bg-zinc-950 p-3 text-left text-sm transition',
                          style.border,
                          canEdit
                            ? 'cursor-pointer hover:bg-zinc-900'
                            : canOpenIssue
                              ? 'cursor-pointer hover:bg-zinc-900'
                              : 'cursor-default opacity-80'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={cn(
                                  'flex h-7 w-7 items-center justify-center rounded-lg',
                                  style.bg
                                )}
                              >
                                <style.Icon className={cn('h-4 w-4', style.icon)} />
                              </span>
                              <p className="font-semibold truncate">{issue.title}</p>
                            </div>
                          </div>
                          {primaryAssigneeEmail && (
                            <div
                              className="h-7 w-7 shrink-0 rounded-full bg-zinc-800 text-zinc-100 flex items-center justify-center text-[10px] font-semibold"
                              title={primaryAssigneeEmail}
                            >
                              {getInitials(primaryAssigneeEmail)}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          {(() => {
                            const priorityStyle =
                              priorityIcons[issue.priority] || priorityIcons.medium
                            return (
                              <div
                                className="flex items-center"
                                title={`Priority: ${priorityStyle.label}`}
                              >
                                <PriorityIcon
                                  count={priorityStyle.count}
                                  className={priorityStyle.color}
                                />
                              </div>
                            )
                          })()}
                          {issue.story_points !== null && (
                            <div className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-200">
                              {issue.story_points} pts
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div
            className={cn(
              'w-full max-w-6xl rounded-2xl border bg-zinc-900 p-6 shadow-xl max-h-[85vh] overflow-hidden flex flex-col',
              (typeStyles[type] || typeStyles.task).border
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    (typeStyles[type] || typeStyles.task).bg
                  )}
                >
                  {(() => {
                    const style = typeStyles[type] || typeStyles.task
                    const Icon = style.Icon
                    return <Icon className={cn('h-5 w-5', style.icon)} />
                  })()}
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {typeStyles[type]?.label || 'Task'}
                  </p>
                  <h2 className="text-lg font-semibold">
                    {mode === 'edit' ? 'Edit Issue' : 'New Task'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-zinc-800 bg-zinc-800 p-2"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>

            <form className="mt-4 flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
              <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] flex-1 min-h-0">
                <div className="space-y-5 overflow-y-auto pr-1 min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800/80 [&::-webkit-scrollbar-thumb]:rounded-full">
                  <div>
                    <label
                      className="text-sm text-zinc-400"
                      htmlFor="issue-title"
                    >
                      Title
                    </label>
                    <input
                      id="issue-title"
                      name="title"
                      type="text"
                      required
                      disabled={isEditReadOnly}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className={cn(
                        'mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-base',
                        isEditReadOnly && 'opacity-70'
                      )}
                      placeholder="Create a new login flow"
                    />
                  </div>
                  <div>
                    <label
                      className="text-sm text-zinc-400"
                      htmlFor="issue-desc"
                    >
                      Description
                    </label>
                    <textarea
                      id="issue-desc"
                      name="description"
                      rows={8}
                      disabled={isEditReadOnly}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className={cn(
                        'mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm',
                        isEditReadOnly && 'opacity-70'
                      )}
                      placeholder="Describe the task requirements"
                    />
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <h3 className="text-sm font-semibold">Attachments</h3>
                    {mode === 'create' ? (
                      <p className="mt-2 text-sm text-zinc-500">
                        Save the issue to add attachments.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <div className="max-h-32 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-2">
                          {(attachmentsByIssue[editingId || ''] || []).length ===
                            0 && (
                            <p className="text-xs text-zinc-500">
                              No attachments yet.
                            </p>
                          )}
                          {(attachmentsByIssue[editingId || ''] || []).map(
                            (item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-300"
                              >
                                <span className="truncate">{item.title}</span>
                                <div className="flex items-center gap-2">
                                  <a
                                    className="text-emerald-300 hover:text-emerald-200"
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                  >
                                    Download
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAttachment(item)}
                                    className="text-zinc-400 hover:text-red-300"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsUploadOpen(true)}
                          >
                            Upload File
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <h3 className="text-sm font-semibold">Comments</h3>
                    {mode === 'create' ? (
                      <p className="mt-2 text-sm text-zinc-500">
                        Save the issue to add comments.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-2">
                          {(commentsByIssue[editingId || ''] || []).length ===
                            0 && (
                            <p className="text-xs text-zinc-500">
                              No comments yet.
                            </p>
                          )}
                          {(commentsByIssue[editingId || ''] || []).map(
                            (comment) => (
                              <div
                                key={comment.id}
                                className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300"
                              >
                                <div
                                  className="h-8 w-8 shrink-0 rounded-full bg-zinc-800 text-zinc-100 flex items-center justify-center text-[10px] font-semibold"
                                  title={
                                    commentAuthorById[comment.author_id || '']
                                      ?.email ||
                                    comment.author_id ||
                                    'Unknown'
                                  }
                                >
                                  {getInitials(
                                    commentAuthorById[comment.author_id || '']
                                      ?.email
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs text-zinc-400">
                                    {commentAuthorById[comment.author_id || '']
                                      ?.email ||
                                      comment.author_id ||
                                      'Unknown user'}{' '}
                                    <span className="text-zinc-500">
                                      {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                  </p>
                                  <p className="mt-1 text-sm text-zinc-200">
                                    {comment.body}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="ml-auto text-zinc-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            value={commentBody}
                            onChange={(event) =>
                              setCommentBody(event.target.value)
                            }
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
                            placeholder="Add a comment"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddComment}
                          >
                            Add Comment
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <h3 className="text-sm font-semibold">Work log</h3>
                    {mode === 'create' ? (
                      <p className="mt-2 text-sm text-zinc-500">
                        Save the issue to log hours.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-2">
                          {(workLogsByIssue[editingId || ''] || []).length ===
                            0 && (
                            <p className="text-xs text-zinc-500">
                              No work logged yet.
                            </p>
                          )}
                          {(workLogsByIssue[editingId || ''] || []).map(
                            (log) => (
                              <div
                                key={log.id}
                                className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300"
                              >
                                <div
                                  className="h-8 w-8 shrink-0 rounded-full bg-zinc-800 text-zinc-100 flex items-center justify-center text-[10px] font-semibold"
                                  title={
                                    workLogAuthorById[log.logged_by || '']
                                      ?.email ||
                                    log.logged_by ||
                                    'Unknown'
                                  }
                                >
                                  {getInitials(
                                    workLogAuthorById[log.logged_by || '']?.email
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 text-zinc-400">
                                    <span>
                                      {workLogAuthorById[log.logged_by || '']
                                        ?.email ||
                                        log.logged_by ||
                                        'Unknown user'}
                                    </span>
                                    <span className="text-zinc-500">
                                      {log.work_date}
                                    </span>
                                    <span className="text-zinc-500">
                                      {log.hours}h
                                    </span>
                                  </div>
                                  {log.note && (
                                    <p className="mt-1 text-sm text-zinc-200">
                                      {log.note}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWorkLog(log.id)}
                                  className="ml-auto text-zinc-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                        {canLogHours ? (
                          <>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div>
                                <label className="text-xs text-zinc-500">
                                  Date
                                </label>
                                <input
                                  type="date"
                                  value={workDate}
                                  onChange={(event) =>
                                    setWorkDate(event.target.value)
                                  }
                                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-zinc-500">
                                  Hours
                                </label>
                                <input
                                  type="number"
                                  min={0.25}
                                  max={24}
                                  step={0.25}
                                  value={workHours ?? ''}
                                  onChange={(event) =>
                                    setWorkHours(
                                      event.target.value === ''
                                        ? null
                                        : Number(event.target.value)
                                    )
                                  }
                                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
                                  placeholder="2"
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="text-xs text-zinc-500">
                                  Note
                                </label>
                                <textarea
                                  rows={2}
                                  value={workNote}
                                  onChange={(event) =>
                                    setWorkNote(event.target.value)
                                  }
                                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
                                  placeholder="What did you work on?"
                                />
                              </div>
                            </div>
                            <div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddWorkLog}
                              >
                                Log hours
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-zinc-500">
                            Only assignees can log hours for this issue.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 overflow-y-auto pr-1 min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800/80 [&::-webkit-scrollbar-thumb]:rounded-full">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <h3 className="text-sm font-semibold">Details</h3>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-xs text-zinc-500">Type</label>
                        <Select value={type} onValueChange={setType} disabled={isEditReadOnly}>
                          <SelectTrigger className="mt-2" disabled={isEditReadOnly}>
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
                        <label className="text-xs text-zinc-500">Status</label>
                        <Select value={status} onValueChange={setStatus} disabled={isEditReadOnly}>
                          <SelectTrigger className="mt-2" disabled={isEditReadOnly}>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Sprint</label>
                        <Select
                          value={sprintId}
                          onValueChange={(value) => setSprintId(value)}
                          disabled={isEditReadOnly}
                        >
                          <SelectTrigger className="mt-2" disabled={isEditReadOnly}>
                            <SelectValue placeholder="Backlog" />
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
                      <div>
                        <label className="text-xs text-zinc-500">Priority</label>
                        <Select value={priority} onValueChange={setPriority} disabled={isEditReadOnly}>
                          <SelectTrigger className="mt-2" disabled={isEditReadOnly}>
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
                        <label className="text-xs text-zinc-500">Assignee</label>
                        <Select
                          value={selectedMember}
                          onValueChange={(value) => setSelectedMember(value)}
                          disabled={isEditReadOnly}
                        >
                          <SelectTrigger className="mt-2" disabled={isEditReadOnly}>
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
                      <div>
                        <label className="text-xs text-zinc-500">
                          Story points
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          disabled={isEditReadOnly}
                          value={storyPoints ?? ''}
                          onChange={(event) =>
                            setStoryPoints(
                              event.target.value === ''
                                ? null
                                : Number(event.target.value)
                            )
                          }
                          className={cn(
                            'mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm',
                            isEditReadOnly && 'opacity-70'
                          )}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">
                          Complexity
                        </label>
                        <Select
                          value={complexity}
                          onValueChange={setComplexity}
                          disabled={isEditReadOnly}
                        >
                          <SelectTrigger className="mt-2" disabled={isEditReadOnly}>
                            <SelectValue placeholder="Select complexity" />
                          </SelectTrigger>
                          <SelectContent>
                            {complexityOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Due date</label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(event) => setDueDate(event.target.value)}
                          disabled={isEditReadOnly}
                          className={cn(
                            'mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm',
                            isEditReadOnly && 'opacity-70'
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-300">{error}</p>}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-end gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    {isEditReadOnly ? 'Close' : 'Cancel'}
                  </Button>
                  {!isEditReadOnly && (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? mode === 'edit'
                          ? 'Saving...'
                          : 'Creating...'
                        : mode === 'edit'
                          ? 'Save changes'
                          : 'Create Task'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upload Attachment</h2>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-lg border border-zinc-800 bg-zinc-800 p-2"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
                          <input
                            type="file"
                            accept=".doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            onChange={(event) =>
                              setUploadFile(event.target.files?.[0] || null)
                            }
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                          />
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!uploadFile || isUploading}
                  onClick={handleUploadAttachment}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

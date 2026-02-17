'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Plus, X } from 'lucide-react'
import FullScreenLoader from '@/components/full-screen-loader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

type Project = {
  id: string
  name: string
  description: string | null
}

type Member = {
  id: string
  email: string | null
  role: 'admin' | 'member'
}

type ProjectMember = {
  project_id: string
  user_id: string
}

type ProjectsPanelProps = {
  initialProjects: Project[]
  canCreate: boolean
  members: Member[]
  projectMembers: ProjectMember[]
}

export default function ProjectsPanel({
  initialProjects,
  canCreate,
  members,
  projectMembers,
}: ProjectsPanelProps) {
  const router = useRouter()
  const projects = initialProjects
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSelectOpen, setIsSelectOpen] = useState(false)

  const assignmentsByProject = projectMembers.reduce<Record<string, string[]>>(
    (acc, item) => {
      if (!acc[item.project_id]) acc[item.project_id] = []
      acc[item.project_id].push(item.user_id)
      return acc
    },
    {}
  )

  const openCreateModal = () => {
    setMode('create')
    setEditingId(null)
    setName('')
    setDescription('')
    setSelectedMembers([])
    setError(null)
    setIsOpen(true)
  }

  const openEditModal = (project: Project) => {
    setMode('edit')
    setEditingId(project.id)
    setName(project.name)
    setDescription(project.description || '')
    setSelectedMembers(assignmentsByProject[project.id] || [])
    setError(null)
    setIsOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    setIsLoading(true)

    try {
      const endpoint =
        mode === 'edit' ? '/api/admin/update-project' : '/api/admin/create-project'
      const payload =
        mode === 'edit'
          ? { projectId: editingId, name, description, memberIds: selectedMembers }
          : { name, description, memberIds: selectedMembers }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Unable to create project.')
        toast.error(data.error || 'Unable to create project.')
        return
      }

      setIsOpen(false)
      toast.success(mode === 'edit' ? 'Project updated.' : 'Project created.')
      router.refresh()
    } catch {
      setError('Unable to create project.')
      toast.error('Unable to create project.')
    } finally {
      setIsSubmitting(false)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {isLoading && <FullScreenLoader label="Creating project..." />}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-800 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Track initiatives across teams and workstreams.
            </p>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4 text-zinc-400" />
              Create new project
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {projects.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-800 p-6 text-sm text-zinc-400">
            No projects found.
          </div>
        )}
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => (canCreate ? openEditModal(project) : null)}
            className="text-left rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:bg-zinc-800"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{project.name}</h2>
              <span className="text-xs text-zinc-500">
                Members: {(assignmentsByProject[project.id] || []).length}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              {project.description || 'No description provided.'}
            </p>
          </button>
        ))}
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {mode === 'edit' ? 'Edit Project' : 'Create Project'}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-zinc-800 bg-zinc-800 p-2"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm text-zinc-400" htmlFor="project-name">
                  Project name
                </label>
                <input
                  id="project-name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                  placeholder="Roadmap 2026"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400" htmlFor="project-desc">
                  Description
                </label>
                <textarea
                  id="project-desc"
                  name="description"
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                  placeholder="What this project covers"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Assign members</label>
                <Popover open={isSelectOpen} onOpenChange={setIsSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 w-full justify-between bg-zinc-950"
                    >
                      {selectedMembers.length > 0
                        ? `${selectedMembers.length} selected`
                        : 'Select members'}
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[320px] p-0">
                    <Command>
                      <CommandInput placeholder="Search members..." />
                      <CommandList>
                        <CommandEmpty>No members found.</CommandEmpty>
                        <CommandGroup>
                          {members.map((member) => {
                            const isSelected = selectedMembers.includes(
                              member.id
                            )
                            return (
                              <CommandItem
                                key={member.id}
                                value={member.email || member.id}
                                onSelect={() => {
                                  setSelectedMembers((prev) => {
                                    if (isSelected) {
                                      return prev.filter((id) => id !== member.id)
                                    }
                                    return [...prev, member.id]
                                  })
                                }}
                                onMouseDown={(event) => {
                                  event.preventDefault()
                                  setSelectedMembers((prev) => {
                                    if (isSelected) {
                                      return prev.filter((id) => id !== member.id)
                                    }
                                    return [...prev, member.id]
                                  })
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4 text-zinc-500',
                                    isSelected ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                <span className="flex-1">
                                  {member.email || member.id}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  {member.role}
                                </span>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedMembers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((memberId) => {
                        const member = members.find((item) => item.id === memberId)
                        return (
                          <Badge
                            key={memberId}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <span>{member?.email || memberId}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedMembers((prev) =>
                                  prev.filter((id) => id !== memberId)
                                )
                              }
                              className="rounded-full p-0.5 text-zinc-400 hover:text-zinc-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMembers([])}
                      className="text-xs text-zinc-400 hover:text-zinc-100"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-red-300">{error}</p>}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-70"
                >
                  {isSubmitting
                    ? mode === 'edit'
                      ? 'Saving...'
                      : 'Creating...'
                    : mode === 'edit'
                      ? 'Save changes'
                      : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
